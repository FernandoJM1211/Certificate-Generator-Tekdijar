const JSZip = require("jszip");

/**
 * Mengganti placeholder {{NAMA}} di dalam file PPTX.
 *
 * @param {Buffer} templateBuffer - File PPTX template
 * @param {string} nama - Nama peserta
 * @returns {Promise<Buffer>} - PPTX hasil
 */
async function generateCertificate(templateBuffer, nama) {
    if (!nama || !nama.trim()) {
        throw new Error("Nama peserta tidak boleh kosong.");
    }

    const zip = await JSZip.loadAsync(templateBuffer);

    const slideFiles = Object.keys(zip.files).filter(
        (fileName) =>
            fileName.startsWith("ppt/slides/slide") &&
            fileName.endsWith(".xml")
    );

    if (slideFiles.length === 0) {
        throw new Error("Tidak ditemukan slide dalam file PPTX.");
    }

    let placeholderFound = false;

    for (const fileName of slideFiles) {
        const file = zip.file(fileName);

        if (!file) {
            continue;
        }

        let xml = await file.async("string");

        if (xml.includes("{{NAMA}}")) {
            xml = xml.replaceAll("{{NAMA}}", nama.trim());
            placeholderFound = true;

            zip.file(fileName, xml);
        }
    }

    if (!placeholderFound) {
        throw new Error(
            'Placeholder "{{NAMA}}" tidak ditemukan di template.'
        );
    }

    return await zip.generateAsync({
        type: "nodebuffer",
        compression: "DEFLATE",
    });
}

module.exports = {
    generateCertificate,
};