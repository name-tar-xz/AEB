var easystarjs = require("easystarjs");
var easystar = new easystarjs.js();
const app = require("express")();
var stringSimilarity = require("string-similarity");
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");

app.listen(3000);
app.get("/", function(req, res) {
  res.json({ data: "why here" });
});

const sdk = require("api")("@eden-ai/v2.0#aopbwm1buljpui144");

sdk.auth(process.env.token);

app.get("/api", async (req, res) => {
  if (!req.query.link || req.query.link == "")
    return res.status(401).json({ error: "invalid link" });
  if (!req.query.pass || req.query.pass != process.env.pass)
    return res.status(401).json({ error: "invalid password" });
  if (!req.query.input || req.query.input == "")
    return res.status(401).json({ error: "invalid input" });

  let a = await sdk
    .image_object_detection_create({
      providers: "sentisight,amazon",
      file_url: req.query.link,
    })
    .then(({ data }) => {
      return data;
    })
    .catch((err) => console.error(err));

  console.log("Link: " + req.query.link);

  console.log("Input: " + req.query.input);
  const predicts = [];
  let aDeez = a.sentisight.items.length;
  for (var i = 0; i < a.sentisight.items.length; i++) {
    predicts.push(a.sentisight.items[i].label);
  }
  for (var i = 0; i < a.sentisight.items.length; i++) {
    predicts.push(a.amazon.items[i].label);
  }
  //console.log(predicts)
  var matches = stringSimilarity.findBestMatch(req.query.input, predicts);
  let matchd;
  if (matches.bestMatchIndex < aDeez) {
    matchd = a.sentisight.items[matches.bestMatchIndex];
  } else if (matches.bestMatchIndex >= aDeez) {
    matchd = a.amazon.items[matches.bestMatchIndex];
  }
  console.log(matchd);
  console.log(predicts);
  let id = req.query.link
    .replace("https://i.imgur.com/", "")
    .replace(".jpg", "")
    .replace(".png", "")
    .replace(".jpeg", "");
  /*console.log("Curl");
  const exec = require('child_process')
  var result = "";
  var newdft=`curl https://aeapi.bumblebee13.repl.co/img?label=${matchd.label}&x_min=${matchd.x_min}&y_min=${matchd.y_min}&x_max=${matchd.x_max}&y_max=${matchd.y_max}&link=${req.query.link} -o ${__dirname}/images/dumb.jpg`
  console.log(newdft)
  //try {
    result = await exec.execSync(newdft)
  //}
  //catch (e) {
    //result = e
  //}
  console.log("Result:"+result)*/

  res.json({
    data: req.query.link,
    input: req.query.input,
    match: matchd,
    img_link: `https://aeapi.bumblebee13.repl.co/img?label=${matchd.label}&x_min=${matchd.x_min}&y_min=${matchd.y_min}&x_max=${matchd.x_max}&y_max=${matchd.y_max}&link=${req.query.link}`,
  });
});

app.get("/img", async (req, res) => {
  let label = req.query.label;
  let x_min = req.query.x_min;
  let y_min = req.query.y_min;
  let x_max = req.query.x_max;
  let y_max = req.query.y_max;

  const img = await loadImage(req.query.link);
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext("2d");
  /*console.log(img)
    console.log(ctx);*/
  ctx.drawImage(img, 0, 0, img.width, img.height);
  ctx.beginPath();
  ctx.lineWidth = "10";
  ctx.strokeStyle = "#ff0000"; //red,green,cyan, or pink
  ctx.strokeRect(
    x_min * img.width,
    y_min * img.height,
    (x_max - x_min) * img.width,
    (y_max - y_min) * img.height
  );
  ctx.stroke();
  ctx.font = "70px Arial";
  ctx.fillStyle = "red";
  ctx.textAlign = "center";
  let xx = x_max * img.width;
  let xn = x_min * img.width;
  let xa = (xx + xn) / 2;
  let cx = x_max * img.width;
  let cy = y_min * img.height - 15;
  /*
  let cx=((x_max*img.width))
  let cy=((y_min*img.height)-10)
  */

  ctx.fillText(label, xa, cy);
  res.writeHead(200, {
    "Content-Type": "image/png",
  });
  res.end(canvas.toBuffer("image/png"));
});

app.get("/api/setData/:data", (req, res) => {
  console.log(req.params.data);
  res.send("Hello");

  let test = req.params.data.replace(/\\n/g, "\n");
  let d = test.split("\n");
  let mainArr = [];

  for (let i = 0; i < d.length; i++) {
    if (d[i] != "") {
      mainArr.push(d[i].split(""));
    }
  }
  console.log(mainArr);
});

function pathFinding(a, b, c, d, e) {
  easystar.setGrid(a);
  easystar.setAcceptableTiles([0]);
  easystar.setIterationsPerCalculation(1000);
  easystar.calculate();
  easystar.findPath(b, c, d, e, function(path) {
    if (path === null) {
      console.log("Path was not found.");
    } else {
      console.log(
        "Path was found. The first Point is " + path[0].x + " " + path[0].y
      );
      return path;
    }
  });
}

app.get("/api/ocr", (req, res) => {
  console.log(req.query.query);

  sdk
    .ocr_ocr_create({
      response_as_dict: true,
      attributes_as_list: false,
      show_original_response: false,
      providers: "sentisight",
      file_url: req.query.query,
      language: "en",
    })
    .then(({ data }) => {
      let d = data.sentisight.text.trim();
      console.log(d);
      if (
        d != "NW" &&
        d != "SW" &&
        d != "NE" &&
        d != "SE" &&
        d != "N" &&
        d != "S" &&
        d != "E" &&
        d != "W"
      )
        return res.send("OCR FAILED");
      if (d != "NW" && d != "SW" && d != "NE" && d != "SE")
        return res.send(data.sentisight.text);
      else if (d != "N" && d != "S" && d != "E" && d != "W") {
        return res.send("Please turn to a cardinal direction!");
      } else {
        res.send("Error occurred");
      }
    })
    .catch((err) => {
      return res.send(err);
    });
});

/*
  1
4   2
  3
 */
function getDirs(face) {
  let times = 0;
  for (let i = 1; i < test.length; i++) {
    let xa = test[i - 1].x;
    let ya = test[i - 1].y;
    let xb = test[i].x;
    let yb = test[i].y;
    let dir = "";
    // console.log(xa, ya, xb, yb);
    if (face == 1) {
      if (xa + 1 == xb) {
        if (times != 0) {
          console.log("continue in same dir " + times + " times");
          times = 0;
        }
        dir = "right";
        face = 2;
      }
      if (xb + 1 == xa) {
        if (times != 0) {
          console.log("continue in same dir " + times + " times");
          times = 0;
        }
        dir = "left";
        face = 4;
      }
      if (ya + 1 == yb) {
        if (times != 0) {
          console.log("continue in same dir " + times + " times");
          times = 0;
        }
        dir = "backward";
        face = 3;
      }
      if (yb + 1 == ya) {
        times += 1;
      }
    } else if (face == 2) {
      if (xa + 1 == xb) {
        times += 1;
      }
      if (xb + 1 == xa) {
        if (times != 0) {
          console.log("continue in same dir " + times + " times");
          times = 0;
        }
        dir = "backward";
        face = 4;
      }
      if (ya + 1 == yb) {
        if (times != 0) {
          console.log("continue in same dir " + times + " times");
          times = 0;
        }
        dir = "right";
        face = 3;
      }
      if (yb + 1 == ya) {
        if (times != 0) {
          console.log("continue in same dir " + times + " times");
          times = 0;
        }
        dir = "left";
        face = 1;
      }
    } else if (face == 3) {
      if (xa + 1 == xb) {
        if (times != 0) {
          console.log("continue in same dir " + times + " times");
          times = 0;
        }
        dir = "left";
        face = 2;
      }
      if (xb + 1 == xa) {
        if (times != 0) {
          console.log("continue in same dir " + times + " times");
          times = 0;
        }
        dir = "right";
        face = 3;
      }
      if (ya + 1 == yb) {
        times += 1;
      }
      if (yb + 1 == ya) {
        if (times != 0) {
          console.log("continue in same dir " + times + " times");
          times = 0;
        }
        dir = "backward";
        face = 1;
      }
    } else if (face == 4) {
      if (xa + 1 == xb) {
        if (times != 0) {
          console.log("continue in same dir " + times + " times");
          times = 0;
        }
        dir = "backward";
        face = 2;
      }
      if (xb + 1 == xa) {
        times += 1;
      }
      if (ya + 1 == yb) {
        if (times != 0) {
          console.log("continue in same dir " + times + " times");
          times = 0;
        }
        dir = "left";
        face = 3;
      }
      if (yb + 1 == ya) {
        if (times != 0) {
          console.log("continue in same dir " + times + " times");
          times = 0;
        }
        dir = "right";
        face = 1;
      }
    }
    if (dir != "") {
      console.log(dir);
    }
  }
}
