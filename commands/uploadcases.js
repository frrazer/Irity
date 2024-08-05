const axios = require("axios");
const databaseService = require("../services/databaseService");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

async function uploadToRoblox(url) {
  // Download the image from the provided URL
  const imagePath = path.join(__dirname, "temp_image.png");
  const writer = fs.createWriteStream(imagePath);
  const response = await axios({
    url,
    method: "GET",
    responseType: "stream",
  });

  response.data.pipe(writer);

  await new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });

  // Create form data
  const form = new FormData();
  form.append(
    "request",
    JSON.stringify({
      assetType: "Decal",
      displayName: "Name",
      description: "This is a description",
      creationContext: {
        creator: {
          userId: "355661302",
        },
      },
    })
  );
  form.append("fileContent", fs.createReadStream(imagePath), {
    filename: "temp_image.png",
    contentType: "image/png",
  });

  const config = {
    method: "post",
    url: "https://apis.roblox.com/assets/v1/assets",
    headers: {
      "x-api-key":
        "",
      ...form.getHeaders(),
    },
    data: form,
  };

  const responseUpload = await axios(config);
  console.log(responseUpload.data);
  fs.unlinkSync(imagePath);
  await new Promise((resolve) => setTimeout(resolve, 4000));

  // Request the asset details
  console.log(`https://apis.roblox.com/assets/v1/${responseUpload.data.path}`);
  config.url = `https://apis.roblox.com/assets/v1/${responseUpload.data.path}`;
  config.headers = {
    "x-api-key": config.headers["x-api-key"],
  };
  config.method = "get";
  delete config.data;

  const responseDetails = await axios(config);
  return responseDetails.data;
}

module.exports = {
  name: "uploadcases",
  description: "Uploads all cases",
  execute: async (message, args) => {
    const database = await databaseService.getDatabase("ArcadeHaven");
    const cases = database.collection("cases");

    const all_cases = await cases
      .find({ Image: { $regex: "^https://", $options: "i" } })
      .toArray();

    async function processCases() {
      for (const crate of all_cases) {
        await message.channel.send(crate.Image);
        console.log(crate.Image);
        console.log("Upload? (y/n)");

        const input = await new Promise((resolve) => {
          const stdin = process.openStdin();
          stdin.addListener("data", (d) => {
            const input = d.toString().trim();
            resolve(input);
            stdin.end();
          });
        });

        if (input === "y") {
          try {
            const response = await uploadToRoblox(crate.Image);
            console.log(response);
            cases.updateOne(
              { _id: crate._id },
              {
                $set: {
                  Image: `rbxthumb://type=Asset&id=${response.response.assetId}&w=420&h=420`
                },
              }
            )
          } catch (error) {
            console.error(error)
            console.error(error.response.data);
          }
        } else {
          console.log("Skipped");
        }
      }
    }

    processCases();

    console.log("Done");
  },
};
