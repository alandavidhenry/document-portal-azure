const express = require("express");
const router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Document Portal" });
});

/* GET links page. */
router.get("/documents", async (req, res) => {
  try {
    const doc1Url = await getSignedUrl("document1.pdf");
    const doc2Url = await getSignedUrl("document2.pdf");
    const doc3Url = await getSignedUrl("document3.pdf");
    res.render("documents", {
      title: "Document Portal",
      doc1Url,
      doc2Url,
      doc3Url,
    });
    console.log("route url:", url);
  } catch (error) {
    console.error("Error generating signed URLs:", error);
    res.status(500).send("Error accessing documents" + error.message);
  }
});

module.exports = router;
