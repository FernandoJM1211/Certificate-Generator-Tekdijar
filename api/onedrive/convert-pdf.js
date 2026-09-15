const {
    getSession,
} = require("../../lib/session");


module.exports = async function handler(req, res) {

    if (req.method !== "POST") {

        return res.status(405).json({
            success: false,
            message: "Method tidak diizinkan.",
        });

    }


    try {

        /*
         * =====================================
         * Ambil session Microsoft
         * =====================================
         */

        const session =
            getSession(req);


        if (!session) {

            return res.status(401).json({
                success: false,
                message:
                    "Session Microsoft tidak ditemukan atau sudah kedaluwarsa.",
            });

        }


        /*
         * =====================================
         * Ambil data request
         * =====================================
         */

        const {
            parentId,
            fileName,
            deleteSource = false,
        } = req.body;


        if (!fileName) {

            return res.status(400).json({
                success: false,
                message:
                    "Nama file PPTX tidak ditemukan.",
            });

        }


        /*
         * =====================================
         * Cari file PPTX di folder
         * =====================================
         */

        let childrenUrl;


        if (parentId) {

            childrenUrl =
                `https://graph.microsoft.com/v1.0/me/drive/items/${encodeURIComponent(parentId)}/children` +
                "?$select=id,name,file,folder";

        } else {

            childrenUrl =
                "https://graph.microsoft.com/v1.0/me/drive/root/children" +
                "?$select=id,name,file,folder";

        }


        const childrenResponse =
            await fetch(
                childrenUrl,
                {
                    method: "GET",

                    headers: {
                        Authorization:
                            `Bearer ${session.accessToken}`,
                    },
                }
            );


        const childrenData =
            await childrenResponse.json();


        if (!childrenResponse.ok) {

            console.error(
                "Microsoft Graph children error:",
                childrenResponse.status,
                childrenData
            );


            return res.status(
                childrenResponse.status
            ).json({
                success: false,

                message:
                    childrenData.error?.message ||
                    "Gagal mencari file PPTX di OneDrive.",
            });

        }


        /*
         * =====================================
         * Cari file berdasarkan nama
         * =====================================
         */

        const sourceFile =
            (childrenData.value || []).find(
                (item) =>
                    item.name === fileName &&
                    item.file
            );


        if (!sourceFile) {

            return res.status(404).json({
                success: false,

                message:
                    `File "${fileName}" tidak ditemukan di folder OneDrive.`,
            });

        }


        /*
         * =====================================
         * Convert PPTX → PDF
         * =====================================
         */

        const convertUrl =
            `https://graph.microsoft.com/v1.0/me/drive/items/${encodeURIComponent(sourceFile.id)}/content?format=pdf`;


        const convertResponse =
            await fetch(
                convertUrl,
                {
                    method: "GET",

                    headers: {
                        Authorization:
                            `Bearer ${session.accessToken}`,
                    },
                }
            );


        if (!convertResponse.ok) {

            const errorText =
                await convertResponse.text();


            console.error(
                "Microsoft Graph conversion error:",
                convertResponse.status,
                errorText
            );


            return res.status(
                convertResponse.status
            ).json({
                success: false,

                message:
                    "Gagal mengkonversi PPTX menjadi PDF.",

                details:
                    errorText,
            });

        }


        /*
         * =====================================
         * Ambil hasil PDF sebagai Buffer
         * =====================================
         */

        const pdfBuffer =
            Buffer.from(
                await convertResponse.arrayBuffer()
            );


        if (!pdfBuffer.length) {

            return res.status(500).json({
                success: false,

                message:
                    "Microsoft Graph mengembalikan file PDF kosong.",
            });

        }


        /*
         * =====================================
         * Tentukan nama PDF
         * =====================================
         */

        const pdfFileName =
            fileName.replace(
                /\.pptx$/i,
                ".pdf"
            );


        /*
         * =====================================
         * Upload PDF ke folder yang sama
         * =====================================
         */

        let uploadUrl;


        if (parentId) {

            uploadUrl =
                `https://graph.microsoft.com/v1.0/me/drive/items/${encodeURIComponent(parentId)}:/` +
                `${encodeURIComponent(pdfFileName)}:/content`;

        } else {

            uploadUrl =
                `https://graph.microsoft.com/v1.0/me/drive/root:/` +
                `${encodeURIComponent(pdfFileName)}:/content`;

        }


        const uploadResponse =
            await fetch(
                uploadUrl,
                {
                    method: "PUT",

                    headers: {
                        Authorization:
                            `Bearer ${session.accessToken}`,

                        "Content-Type":
                            "application/pdf",
                    },

                    body: pdfBuffer,
                }
            );


        const uploadData =
            await uploadResponse.json();


        if (!uploadResponse.ok) {

            console.error(
                "Microsoft Graph PDF upload error:",
                uploadResponse.status,
                uploadData
            );


            return res.status(
                uploadResponse.status
            ).json({
                success: false,

                message:
                    uploadData.error?.message ||
                    "Gagal menyimpan PDF ke OneDrive.",
            });

        }


        /*
         * =====================================
         * Hapus file PPTX sumber
         * =====================================
         *
         * Hanya dilakukan jika frontend
         * mengirim deleteSource: true
         */

        let sourceDeleted = false;


        if (deleteSource) {

            const deleteUrl =
                `https://graph.microsoft.com/v1.0/me/drive/items/${encodeURIComponent(sourceFile.id)}`;


            const deleteResponse =
                await fetch(
                    deleteUrl,
                    {
                        method: "DELETE",

                        headers: {
                            Authorization:
                                `Bearer ${session.accessToken}`,
                        },
                    }
                );


            if (!deleteResponse.ok) {

                const deleteError =
                    await deleteResponse.text();


                console.error(
                    "Microsoft Graph delete PPTX error:",
                    deleteResponse.status,
                    deleteError
                );


                /*
                 * PDF sudah berhasil dibuat,
                 * tetapi PPTX gagal dihapus.
                 */

                return res.status(
                    deleteResponse.status
                ).json({

                    success: false,

                    message:
                        "PDF berhasil dibuat, tetapi file PPTX gagal dihapus.",

                    details:
                        deleteError,

                    pdfFile: {

                        id:
                            uploadData.id,

                        name:
                            uploadData.name,

                        size:
                            uploadData.size,

                        webUrl:
                            uploadData.webUrl ||
                            null,
                    },

                });

            }


            sourceDeleted = true;

        }


        /*
         * =====================================
         * Berhasil
         * =====================================
         */

        return res.status(200).json({

            success: true,

            sourceFile: {

                id:
                    sourceFile.id,

                name:
                    sourceFile.name,

            },

            sourceDeleted,

            pdfFile: {

                id:
                    uploadData.id,

                name:
                    uploadData.name,

                size:
                    uploadData.size,

                webUrl:
                    uploadData.webUrl ||
                    null,

            },

        });


    } catch (error) {

        console.error(
            "OneDrive convert PDF error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                error.message ||
                "Gagal mengkonversi PPTX menjadi PDF.",

        });

    }

};