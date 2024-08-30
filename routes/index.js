const express = require("express");
const router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Document Portal" });
});

/* GET links page. */
router.get("/documents", async (req, res) => {
  res.render("documents", {
    title: "Document Portal",
    doc1Url: '/#',
    doc2Url: '/#',
    doc3Url: '/#',
  });
});

module.exports = router;
