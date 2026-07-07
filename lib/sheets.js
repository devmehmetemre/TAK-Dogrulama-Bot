import { google } from "googleapis";

function getAuth() {
  return new google.auth.JWT(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    null,
    (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
    ["https://www.googleapis.com/auth/spreadsheets"]
  );
}

function getSheets() {
  return google.sheets({ version: "v4", auth: getAuth() });
}

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_NAME = process.env.SHEET_NAME || "Sheet1";

// Tüm satırları çeker (başlık hariç)
export async function getAllRows() {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A2:E`,
  });
  return res.data.values || [];
}

// UserID'ye göre satır numarasını bulur (bulamazsa null)
export async function findRowByUserId(userId) {
  const rows = await getAllRows();
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] && String(rows[i][0]).trim() === String(userId)) {
      return i + 2;
    }
  }
  return null;
}

// Discord ID'ye göre satır numarasını ve veriyi bulur (bulamazsa null)
export async function findRowByDiscordId(discordId) {
  const rows = await getAllRows();
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][4] && String(rows[i][4]).trim() === String(discordId)) {
      return {
        rowNumber: i + 2,
        userId: rows[i][0] || "",
        rank: rows[i][1] || "",
        brans: rows[i][2] || "",
        birim: rows[i][3] || "",
        discordId: rows[i][4] || "",
      };
    }
  }
  return null;
}

// Belirtilen sütuna değer yazar. Satır yoksa yeni satır ekler.
// column: "B" | "C" | "D" | "E"
export async function setField(userId, column, value) {
  const sheets = getSheets();
  const COLUMN_INDEX = { B: 1, C: 2, D: 3, E: 4 };
  const rowNumber = await findRowByUserId(userId);

  if (rowNumber) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!${column}${rowNumber}`,
      valueInputOption: "RAW",
      requestBody: { values: [[value]] },
    });
  } else {
    const newRow = [userId, "", "", "", ""];
    newRow[COLUMN_INDEX[column]] = value;
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:E`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [newRow] },
    });
  }
}
