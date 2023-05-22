import db from "../database/db.database.js";
import { nanoid } from "nanoid";

const registerUrl = async (req, res) => {
  const { url } = req.body;
  const id = res.locals.user;
  const shortUrl = nanoid(8);
  const query = `INSERT INTO urls ("userId", url, "shortUrl") VALUES ($1, $2, $3) RETURNING *`;

  try {
    const { rows: line } = await db.query(query, [id, url, shortUrl]);
    if (!line) throw new Error("Error to insert url");
    console.log(line[0]);
    res.status(201).send({
      id: line[0].id,
      shortUrl: line[0].shortUrl,
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

const getUrl = async (req, res) => {
  const { id } = req.params;
  const query = `SELECT * FROM urls WHERE id = $1`;

  try {
    const { rows: line } = await db.query(query, [id]);
    if (!line.length) return res.status(404).send({ message: "URL not found" });

    res.status(200).send({
      id: line[0].id,
      shortUrl: line[0].shortUrl,
      url: line[0].url,
    });
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
};

const openUrl = async (req, res) => {
  const { shortUrl } = req.params;
  const query = `UPDATE urls SET "visitCount" = "visitCount" + 1 WHERE "shortUrl" = $1 RETURNING url`;

  try {
    const { rows: url } = await db.query(query, [shortUrl]);
    if (!url.length) return res.status(404).send({ message: "URL not found" });

    return res.redirect(302, url[0].url);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

const deleteUrl = async (req, res) => {
  const { id: urlId } = req.params;
  if (!urlId) return res.status(401).send({ message: "Missing url id" });

  const id = res.locals.user;

  const query = "SELECT * FROM urls WHERE id = $1";
  const queryDelete = "DELETE FROM urls WHERE id = $1";

  try {
    const { rows: line } = await db.query(query, [urlId]);
    if (!line) return res.status(404).send({ message: "URL not found" });
    console.log(line);
    if (line[0].userId !== parseInt(id)) return res.status(401).send({ message: "Unauthorized" });

    await db.query(queryDelete, [urlId]);
    res.sendStatus(204);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

export default { registerUrl, getUrl, openUrl, deleteUrl };
