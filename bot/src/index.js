import "dotenv/config";
import express              from "express";
import twilio               from "twilio";
import { handleMessage }    from "./handler.js";

const app  = express();
const twiml = twilio.twiml;
app.use(express.urlencoded({ extended: false }));

// Twilio signature validation middleware (security — do not remove in prod)
app.use(
  "/webhook",
  twilio.webhook({ validate: process.env.NODE_ENV === "production" })
);

app.post("/webhook", async (req, res) => {
  const phone = req.body.From  ?? "";
  const body  = (req.body.Body ?? "").trim();

  console.log(`[${new Date().toISOString()}] ${phone}: ${body}`);

  let reply = "Sorry, something went wrong.";
  try {
    reply = await handleMessage(phone, body);
  } catch (err) {
    console.error(err);
  }

  const resp = new twiml.MessagingResponse();
  resp.message(reply);
  res.type("text/xml").send(resp.toString());
});

app.get("/health", (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => console.log(`🌱 HarvestFi bot listening on :${PORT}`));
