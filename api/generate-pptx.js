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

        const templateBuffer = Buffer.from(templateBase64, "base64");

        const result = await generateCertificate(
            templateBuffer,
            nama.trim()
        );

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation"
        );

        // Gunakan nama file ASCII tetap agar karakter nama peserta
        // tidak pernah menyebabkan error pada HTTP Content-Disposition header.
        res.setHeader(
            "Content-Disposition",
            'attachment; filename="certificate.pptx"'
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
