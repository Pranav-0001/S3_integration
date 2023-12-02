import dotenv from "dotenv";
import multer from "multer";
import multerS3 from "multer-s3";
import { S3Client } from "@aws-sdk/client-s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";

dotenv.config();

const BUCKET_NAME = process.env.BUCKET_NAME;
const REGION = process.env.REGION;
const ACCESS_KEY = process.env.ACCESS_KEY;
const SECRET_KEY = process.env.SECRET_KEY;

const s3 = new S3Client({
  credentials: {
    accessKeyId: ACCESS_KEY,
    secretAccessKey: SECRET_KEY,
  },
  region: REGION,
});

const uploadWithMulter = () =>
  multer({
    storage: multerS3({
      s3: s3,
      bucket: BUCKET_NAME,
      metadata: function (req, file, cb) {
        cb(null, { fieldname: file.fieldname });
      },
      key: function (req, file, cb) {
        cb(null, file.originalname);
        let folder = '';
        if (file.mimetype.startsWith('image')) {
          folder = 'images/';
        } else if (file.mimetype.startsWith('application/pdf')) {
          folder = 'documents/';
        } else if (file.mimetype.startsWith('video')) {
          folder = 'videos/';
        }
        console.log({folder});
        
        const key = folder + file.originalname;

        cb(null, key);
        return
      },
    }),
  }).array("files", 5);

const createFolder = async (folderName) => {
  const params = {
    Bucket: BUCKET_NAME,
    Key: `${folderName}/`, // Note the trailing slash to represent a folder
    Body: "", // Empty body to represent a folder
  };

  try {
    await s3.send(new PutObjectCommand(params));
    console.log(`Folder "${folderName}" created successfully.`);
  } catch (err) {
    console.error(`Error creating folder "${folderName}":`, err);
  }
};

const listFolders = async (prefix) => {
  const params = {
    Bucket: BUCKET_NAME,
    Prefix: prefix,
    Delimiter: "/",
  };

  try {
    const response = await s3.send(new ListObjectsV2Command(params));
    console.log({
      folderAvailable:
        response.Contents?.length > 0 || response.CommonPrefixes?.length > 0,
    });
    const folders = response.CommonPrefixes?.map((prefix) => prefix.Prefix);
    console.log("Root Folders:", folders);
  } catch (err) {
    console.error("Error listing root folders:", err);
  }
};

export const uploadToAws = (req, res) => {
  const upload = uploadWithMulter();
  upload(req, res, (err) => {
    if (err) {
      console.log(err);
      res.json({ err, msg: "Error while uploading" });
      return;
    }
    res.json({ msg: "file uploaded successfully", files: req.files });
  });
};
