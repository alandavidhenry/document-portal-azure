const express = require("express");
const router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Document Portal" });
});

/* GET documents page. */
router.get("/documents", async (req, res) => {
  const containerClient = req.blobServiceClient.getContainerClient("pdfs");

  let blobs = containerClient.listBlobsFlat();
  let documents = [];

  for await (const blob of blobs) {
    documents.push(blob.name);
  }

  res.render("documents", {
    title: "Document Portal",
    doc1Url: documents[0] ? `/document/${documents[0]}` : '#',
    doc2Url: documents[1] ? `/document/${documents[1]}` : '#',
    doc3Url: documents[2] ? `/document/${documents[2]}` : '#',
  });
});

/* GET specific document. */
router.get("/document/:name", async (req, res) => {
  const containerClient = req.blobServiceClient.getContainerClient('pdfs');
  const blobClient = containerClient.getBlobClient(req.params.name);

  const downloadBlockBlobResponse = await blobClient.download();
  const downloaded = await streamToBuffer(downloadBlockBlobResponse.readableStreamBody);

  res.contentType('application/pdf');
  res.send(downloaded);
});

// Helper function to convert stream to buffer
async function streamToBuffer(readableStream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on("data", (data) => {
      chunks.push(data instanceof Buffer ? data : Buffer.from(data));
    });
    readableStream.on("end", () => {
      resolve(Buffer.concat(chunks));
    });
    readableStream.on("error", reject);
  });
}

module.exports = router;
