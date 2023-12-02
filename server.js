import express from "express";
import s3Router from './routes/s3Router.js'

const app = express();
app.use(express.json());

app.use('/upload',s3Router)


app.listen(3000, () => {
  console.log("server connected");
});
