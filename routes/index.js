const express = require("express");
const router = express.Router();
const { isAuthenticated, hasRole } = require("../middlewares/auth");

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Document Portal", user: req.session.user });
});

/* GET documents page. */
router.get("/documents", isAuthenticated, hasRole(['Admin', 'Employee', 'Customer']), async (req, res) => {
  const containerClient = req.blobServiceClient.getContainerClient("pdfs");

  let blobs = containerClient.listBlobsFlat();
  let documents = [];

  for await (const blob of blobs) {
    documents.push(blob.name);
  }

  res.render("documents", {
    title: "Document Portal",
    documents: documents,
    user: req.session.user,
    userRole: req.session.userRole
  });
});

/* GET specific document. */
router.get(
  "/document/:name",
  isAuthenticated,
  hasRole(["Admin", "Employee", "Customer"]),
  async (req, res) => {
    const containerClient = req.blobServiceClient.getContainerClient("pdfs");
    const blobClient = containerClient.getBlobClient(req.params.name);

    const downloadBlockBlobResponse = await blobClient.download();
    const downloaded = await streamToBuffer(
      downloadBlockBlobResponse.readableStreamBody
    );

    res.contentType("application/pdf");
    res.send(downloaded);
  }
);

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
