const { generateCertificate } = require("../lib/pptx-template");

module.exports = async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            message: "Method tidak diizinkan.",
        });
    }

    try {
        const { nama, templateBase64 } = req.body;

        if (!nama || !nama.trim()) {
            return res.status(400).json({
                success: false,
                message: "Nama peserta tidak boleh kosong.",
            });
        }

        if (!templateBase64) {
            return res.status(400).json({
                success: false,
                message: "Template PPTX tidak ditemukan.",
            });
        }

        // Konversi Base64 menjadi Buffer
        const templateBuffer = Buffer.from(templateBase64, "base64");

        // Generate sertifikat
        const result = await generateCertificate(
            templateBuffer,
            nama.trim()
        );

        // Kirim file PPTX
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation"
        );

        res.setHeader(
            "Content-Disposition",
            `attachment; filename="Sertifikat-${nama.trim()}.pptx"`
        );

        return res.status(200).send(result);

    } catch (error) {

        console.error("Generate PPTX error:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Gagal membuat sertifikat.",
        });
    }
};