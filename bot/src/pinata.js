import fetch from "node-fetch";

const PINATA_URL = "https://api.pinata.cloud/pinning/pinJSONToIPFS";

/**
 * Pin a farmer registration object to IPFS via Pinata.
 * @param {object} metadata
 * @returns {Promise<string>} IPFS CID
 */
export async function pinFarmerMetadata(metadata) {
  const res = await fetch(PINATA_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization:  `Bearer ${process.env.PINATA_JWT}`,
    },
    body: JSON.stringify({
      pinataContent: metadata,
      pinataMetadata: { name: `farmer-${metadata.phone}-${Date.now()}` },
    }),
  });

  if (!res.ok) throw new Error(`Pinata error: ${res.status} ${await res.text()}`);
  const json = await res.json();
  return `ipfs://${json.IpfsHash}`;
}
