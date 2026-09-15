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
         * Ambil session Microsoft
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
         * Ambil data dari request
         */
        const {
            parentId,
            fileName,
            fileBase64,
        } = req.body;


        /*
         * Validasi nama file
         */
        if (!fileName) {

            return res.status(400).json({
                success: false,
                message:
                    "Nama file tidak ditemukan.",
            });

        }


        /*
         * Validasi file
         */
        if (!fileBase64) {

            return res.status(400).json({
                success: false,
                message:
                    "File tidak ditemukan.",
            });

        }


        /*
         * Decode Base64 → Buffer
         */
        const fileBuffer =
            Buffer.from(
                fileBase64,
                "base64"
            );


        /*
         * Buat URL Microsoft Graph
         *
         * Jika parentId ada:
         * upload ke folder tersebut.
         *
         * Jika parentId kosong:
         * upload ke root OneDrive.
         */
        let graphUrl;


        if (parentId) {

            graphUrl =
                `https://graph.microsoft.com/v1.0/me/drive/items/${encodeURIComponent(parentId)}:/` +
                `${encodeURIComponent(fileName)}:/content`;

        } else {

            graphUrl =
                `https://graph.microsoft.com/v1.0/me/drive/root:/` +
                `${encodeURIComponent(fileName)}:/content`;

        }


        /*
         * Upload ke OneDrive
         */
        const response =
            await fetch(
                graphUrl,
                {
                    method: "PUT",

                    headers: {
                        Authorization:
                            `Bearer ${session.accessToken}`,

                        "Content-Type":
                            "application/octet-stream",
                    },

                    body: fileBuffer,
                }
            );


        /*
         * Ambil response
         */
        const data =
            await response.json();


        /*
         * Cek response Microsoft Graph
         */
        if (!response.ok) {

            console.error(
                "Microsoft Graph upload error:",
                response.status,
                data
            );


            return res.status(
                response.status
            ).json({
                success: false,
                message:
                    data.error?.message ||
                    "Gagal mengupload file ke OneDrive.",
            });

        }


        /*
         * Berhasil
         */
        return res.status(200).json({

            success: true,

            account:
                session.username,

            file: {
                id: data.id,
                name: data.name,
                size: data.size,
                webUrl:
                    data.webUrl || null,
            },

        });


    } catch (error) {

        console.error(
            "OneDrive upload error:",
            error
        );


        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Gagal mengupload file ke OneDrive.",
        });

    }

};