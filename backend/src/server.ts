import express, { Express, Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import * as admin from "firebase-admin";
import { Ticket } from "./ticket.model";
import fs from "fs";
import path from "path";

dotenv.config();

// No seu server.ts
try {
  const serviceAccountPath = path.resolve(__dirname, "../service-account.json"); // Caminho absoluto mais seguro

  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(
      fs.readFileSync(serviceAccountPath, "utf-8"),
    );
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("🚀 Firebase Admin Inicializado com Chave Privada!"); // Adicione este log
  } else {
    console.error(
      "❌ ERRO CRÍTICO: Arquivo service-account.json não encontrado em:",
      serviceAccountPath,
    );
    admin.initializeApp(); // Fallback que provavelmente causará o 401
  }
} catch (error) {
  console.error("❌ Erro ao ler service-account.json:", error);
}

// --- CONFIGURAÇÕES E INICIALIZAÇÃO ---
if (!process.env.MONGO_URI || !process.env.GEMINI_API_KEY) {
  console.error(
    "❌ Erro: Variáveis de ambiente MONGO_URI e GEMINI_API_KEY são obrigatórias.",
  );
  process.exit(1);
}

try {
  let serviceAccount: any = null;
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    try {
      serviceAccount = JSON.parse(
        process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON,
      );
    } catch (e) {
      console.error("❌ Erro JSON CREDENTIALS.");
    }
  }
  if (!serviceAccount) {
    const serviceAccountPath = "./service-account.json";
    if (fs.existsSync(serviceAccountPath)) {
      serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));
    }
  }
  if (!admin.apps.length) {
    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      admin.initializeApp();
    }
  }
} catch (error) {
  console.error("❌ Erro init Firebase:", error);
}

const app: Express = express();
const port = process.env.PORT || 3000;

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());

const distPath = path.join(__dirname, "../../dist");
app.use(express.static(distPath));

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

// MIDDLEWARE AUTH
const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer "))
    return res.status(401).send({ error: "Unauthorized" });
  const idToken = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.userId = decodedToken.uid;
    next();
  } catch (error) {
    return res.status(401).send({ error: "Invalid token" });
  }
};

mongoose
  .connect(process.env.MONGO_URI as string)
  .then(() => console.log("✅ MongoDB Conectado!"))
  .catch((err) => {
    console.error("❌ Erro MongoDB:", err);
    process.exit(1);
  });

// ---------------------------------------------------
// ROTAS DA API
// ---------------------------------------------------

// 1. CRIAR TICKET (POST)
app.post("/tickets", authMiddleware, async (req: Request, res: Response) => {
  const {
    solicitante,
    location,
    hub,
    vehicleType,
    isBulky,
    routeId,
    urgency,
    packageCount,
    deliveryRegions,
    prompt: userPrompt,
    firebaseId, // Recebe o ID do Firebase do frontend
  } = req.body;
  const userId = req.userId;

  try {
    const reasonMatch = userPrompt
      ? userPrompt.match(/MOTIVO:\s*(.*?)\./)
      : null;
    const extractedReason = reasonMatch
      ? reasonMatch[1].trim()
      : "Apoio Logístico";

    let extractedDetails = "Detalhes não informados.";
    if (userPrompt) {
      const detailsMatch = userPrompt.match(
        /DETALHES DO OCORRIDO:\s*(.*?)(?=\.\s*Preciso)/,
      );
      if (detailsMatch) extractedDetails = detailsMatch[1].trim();
    }

    let description = "";
    const bulkyIcon = isBulky ? "Sim ⚠️" : "Não";

    try {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(
        process.env.GEMINI_API_KEY as string,
      );
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const finalPrompt = `Role: Formatador de Logística. Dados: Hub: ${hub} Carga: ${packageCount} Volumoso: ${bulkyIcon} Veículo: ${vehicleType} Relato: "${extractedDetails}" Regra: Resuma em formato técnico de lista.`;
      const result = await model.generateContent(finalPrompt);
      description = result.response.text().trim();
    } catch (aiError) {
      description = `📍 Hub: ${hub}\n📦 Carga: ${packageCount}\n🚛 Veículo: ${vehicleType}\n📝 Relato: ${extractedDetails}`;
    }

    const newTicket = new Ticket({
      firebaseId: firebaseId || `fb-pending-${Date.now()}`, // Salva o ID do Firebase para ponte; fallback temporário evita erro 500
      userId,
      prompt: userPrompt,
      description,
      reason: extractedReason,
      solicitante,
      location,
      hub,
      vehicleType,
      isBulky,
      routeId,
      urgency,
      packageCount,
      deliveryRegions,
      status: "ABERTO",
    });
    await newTicket.save();

    res.status(201).send(newTicket);
  } catch (error) {
    console.error("Erro criar ticket:", error);
    res.status(500).send({ error: "Erro interno" });
  }
});

// 2. ATUALIZAR STATUS / PATCH (CORRIGIDO PARA BUSCAR POR QUALQUER ID)
app.patch(
  "/tickets/:id",
  authMiddleware,
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = req.body;

    try {
      // Busca por Mongo _id ou por firebaseId
      const query = mongoose.isValidObjectId(id)
        ? { _id: id }
        : { firebaseId: id };
      const updatedTicket = await Ticket.findOneAndUpdate(query, updates, {
        new: true,
      });

      if (!updatedTicket)
        return res.status(404).send({ error: "Ticket não encontrado." });

      // Sync Firebase (Opcional se o frontend já atualizar o Firebase direto)
      try {
        const snapshot = await admin
          .firestore()
          .collection("supportCalls")
          .where("mongoId", "==", updatedTicket._id.toString())
          .get();

        if (!snapshot.empty) {
          const docRef = snapshot.docs[0].ref;
          if (updates.status === "EXCLUIDO") {
            await docRef.update({
              status: "EXCLUIDO",
              deletedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          } else if (["CONCLUIDO", "ARQUIVADO"].includes(updates.status)) {
            await docRef.delete();
          } else {
            await docRef.update(updates);
          }
        }
      } catch (e) {
        console.error("Erro Sync Firebase:", e);
      }

      res.json(updatedTicket);
    } catch (error) {
      res.status(500).send({ error: "Erro ao atualizar" });
    }
  },
);

// 3. EXCLUSÃO PERMANENTE (DELETE)
app.delete(
  "/tickets/:id",
  authMiddleware,
  async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const query = mongoose.isValidObjectId(id)
        ? { _id: id }
        : { firebaseId: id };
      const deletedTicket = await Ticket.findOneAndDelete(query);

      if (deletedTicket) {
        const snapshot = await admin
          .firestore()
          .collection("supportCalls")
          .where("mongoId", "==", deletedTicket._id.toString())
          .get();
        snapshot.forEach((doc: any) => doc.ref.delete());
      }
      res.status(200).send({ message: "Excluído permanentemente." });
    } catch (error) {
      res.status(500).send({ error: "Erro ao excluir" });
    }
  },
);

// 4. LIMPAR LIXEIRA
app.delete(
  "/tickets/purge/excluded",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      await Ticket.deleteMany({ status: "EXCLUIDO" });
      const snapshot = await admin
        .firestore()
        .collection("supportCalls")
        .where("status", "==", "EXCLUIDO")
        .get();
      const batch = admin.firestore().batch();
      snapshot.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
      res.status(200).send({ message: "Lixeira esvaziada." });
    } catch (error) {
      res.status(500).send({ error: "Erro ao limpar lixeira" });
    }
  },
);

// CHATBOT
app.post("/api/chat", authMiddleware, async (req: Request, res: Response) => {
  const { message, history } = req.body;
  if (!message) return res.status(400).json({ error: "Mensagem vazia." });
  try {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const chat = model.startChat({
      history: history
        ? history.map((msg: any) => ({
            role: msg.role,
            parts: [{ text: msg.parts[0].text }],
          }))
        : [],
    });
    const result = await chat.sendMessage(message);
    res.json({ response: result.response.text() });
  } catch (error) {
    res.json({ response: "Erro no serviço de IA." });
  }
});

app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
app.listen(port, () => console.log(`🚀 API rodando na porta ${port}`));
