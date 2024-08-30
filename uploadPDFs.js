const { BlobServiceClient } = require("@azure/storage-blob");
const fs = require("fs");
const path = require("path");

async function uploadPDFsToAzurite() {
  const connectionString = "UseDevelopmentStorage=true";
  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  
  // Create a container called 'pdfs' if it doesn't exist
  const containerClient = blobServiceClient.getContainerClient("pdfs");
  await containerClient.createIfNotExists();

  // Directory containing your PDF files
  const pdfDirectory = "./public/pdfs";

  // Read all files in the directory
  const files = fs.readdirSync(pdfDirectory);

  for (const file of files) {
    if (path.extname(file).toLowerCase() === ".pdf") {
      const filePath = path.join(pdfDirectory, file);
      const blobClient = containerClient.getBlockBlobClient(file);

      console.log(`Uploading ${file} to Azurite...`);
      await blobClient.uploadFile(filePath);
      console.log(`${file} uploaded successfully.`);
    }
  }
}

uploadPDFsToAzurite().catch(console.error);