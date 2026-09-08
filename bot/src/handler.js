import { getSession, setSession, clearSession } from "./session.js";
import { pinFarmerMetadata }                   from "./pinata.js";
import { createHarvestContract }               from "./chain.js";

const CROPS = { "1": { name: "Coffee", symbol: "hCOFFEE" }, "2": { name: "Vanilla", symbol: "hVANILLA" } };

/**
 * Process one incoming WhatsApp message and return the reply string.
 * @param {string} phone  – sender's WhatsApp number (e.g. "whatsapp:+256...")
 * @param {string} body   – message text (already trimmed)
 * @returns {Promise<string>}
 */
export async function handleMessage(phone, body) {
  const session = getSession(phone);
  const msg     = body.toLowerCase().trim();

  // ── Reset ────────────────────────────────────────────────────────────────
  if (msg === "reset" || msg === "restart") {
    clearSession(phone);
    return "♻️ Session reset. Send *hello* to start again.";
  }

  switch (session.step) {
    // ── Entry ──────────────────────────────────────────────────────────────
    case "start":
      setSession(phone, { step: "name", data: {} });
      return (
        "🌱 *Welcome to HarvestFi!*\n\n" +
        "I will help you register your harvest as a tokenised forward contract on Base.\n\n" +
        "What is the name of your cooperative? (e.g. _Bugisu Cooperative Union_)"
      );

    // ── Cooperative name ───────────────────────────────────────────────────
    case "name":
      setSession(phone, { step: "crop", data: { ...session.data, cooperative: body } });
      return (
        `Got it — *${body}* ✅\n\n` +
        "Which crop are you registering?\n\n1️⃣  Coffee\n2️⃣  Vanilla\n\nReply *1* or *2*."
      );

    // ── Crop type ──────────────────────────────────────────────────────────
    case "crop": {
      const crop = CROPS[msg];
      if (!crop) return "Please reply *1* for Coffee or *2* for Vanilla.";
      setSession(phone, { step: "weight", data: { ...session.data, crop } });
      return `${crop.name} selected 🌿\n\nHow many *kilograms* of ${crop.name} are you pledging? (numbers only, e.g. _500_)`;
    }

    // ── Weight ─────────────────────────────────────────────────────────────
    case "weight": {
      const kg = parseInt(msg, 10);
      if (!kg || kg <= 0) return "Please enter a valid weight in kg (e.g. _500_).";
      setSession(phone, { step: "days", data: { ...session.data, weightKg: kg } });
      return `${kg} kg noted 📦\n\nHow many *days* until the harvest delivery? (e.g. _90_)`;
    }

    // ── Deadline ───────────────────────────────────────────────────────────
    case "days": {
      const days = parseInt(msg, 10);
      if (!days || days < 7) return "Minimum 7 days. Please enter a number (e.g. _90_).";
      setSession(phone, { step: "gps", data: { ...session.data, deadlineDays: days } });
      return "Almost done! 📍\n\nPlease share your farm's *GPS coordinates* (lat, long) — e.g. _1.0456, 34.1234_.\n\n_(This becomes proof-of-farm metadata stored on IPFS.)_";
    }

    // ── GPS ────────────────────────────────────────────────────────────────
    case "gps": {
      // Accept "lat, long" or a shared WhatsApp location message
      setSession(phone, { step: "confirm", data: { ...session.data, gps: body } });
      const d = session.data;
      return (
        `✅ *Review your contract:*\n\n` +
        `• Cooperative: ${d.cooperative}\n` +
        `• Crop: ${session.data.crop?.name ?? "?"}\n` +
        `• Weight: ${d.weightKg} kg\n` +
        `• Deadline: ${(session.data as any).deadlineDays ?? "?"} days\n` +   // will resolve in confirm
        `• GPS: ${body}\n\n` +
        `Reply *YES* to publish on-chain or *NO* to cancel.`
      );
    }

    // ── Confirm ────────────────────────────────────────────────────────────
    case "confirm": {
      if (msg === "no") {
        clearSession(phone);
        return "❌ Cancelled. Send *hello* to start again.";
      }
      if (msg !== "yes") return "Reply *YES* to confirm or *NO* to cancel.";

      try {
        const d = session.data;
        clearSession(phone);

        // 1. Pin metadata to IPFS
        const cid = await pinFarmerMetadata({
          phone,
          cooperative: d.cooperative,
          crop:        d.crop.name,
          weightKg:    d.weightKg,
          deadlineDays:d.deadlineDays,
          gps:         d.gps,
          timestamp:   new Date().toISOString(),
        });

        // 2. Publish forward contract on Base Sepolia
        const { txHash, contractId } = await createHarvestContract({
          name:        `Harvest ${d.crop.name} ${new Date().getFullYear()}`,
          symbol:      d.crop.symbol,
          weightGrams: d.weightKg * 1000,
          deadlineDays:d.deadlineDays,
          cid,
        });

        return (
          `🎉 *Contract published on Base!*\n\n` +
          `• Contract ID: #${contractId}\n` +
          `• IPFS: ${cid}\n` +
          `• Tx: https://sepolia.basescan.org/tx/${txHash}\n\n` +
          `Investors can now fund your harvest at https://harvestfi.xyz 🌱`
        );
      } catch (err) {
        console.error(err);
        return `❌ Something went wrong: ${err.message}\n\nSend *reset* to try again.`;
      }
    }

    default:
      clearSession(phone);
      return "Send *hello* to start registering your harvest.";
  }
}
