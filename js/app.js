const templateFile = document.getElementById("templateFile");
const templateFileInfo = document.getElementById("templateFileInfo");

const validateButton = document.getElementById("validateButton");
const spreadsheetUrl = document.getElementById("spreadsheetUrl");

const selectDriveFolder = document.getElementById("selectDriveFolder");


/*
 * Menampilkan nama template yang dipilih
 */
templateFile.addEventListener("change", () => {

    const file = templateFile.files[0];

    if (!file) {
        templateFileInfo.hidden = true;
        return;
    }

    templateFileInfo.textContent = `✓ ${file.name}`;
    templateFileInfo.hidden = false;

});


/*
 * Tombol pilih folder Drive
 * Untuk sementara belum terhubung ke Google Drive.
 */
selectDriveFolder.addEventListener("click", () => {

    alert(
        "Fitur pemilihan folder Google Drive akan kita hubungkan pada tahap integrasi Google Drive."
    );

});


/*
 * Validasi awal
 */
validateButton.addEventListener("click", () => {

    const template = templateFile.files[0];
    const spreadsheet = spreadsheetUrl.value.trim();

    if (!template) {
        alert("Silakan upload template sertifikat terlebih dahulu.");
        return;
    }

    if (!template.name.toLowerCase().endsWith(".docx")) {
        alert("Template harus menggunakan format DOCX.");
        return;
    }

    if (!spreadsheet) {
        alert("Silakan masukkan link Google Spreadsheet.");
        return;
    }

    alert(
        "Data awal sudah lengkap. Integrasi validasi Google Spreadsheet akan kita buat pada tahap berikutnya."
    );

});