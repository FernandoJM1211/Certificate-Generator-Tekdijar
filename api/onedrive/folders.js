const {
    getSession,
} = require("../../lib/session");

module.exports = async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({
            success: false,
            message: "Method tidak diizinkan.",
        });
    }

    try {
        const session = getSession(req);

        if (!session) {
            return res.status(401).json({
                success: false,
                message:
                    "Session Microsoft tidak ditemukan atau sudah kedaluwarsa.",
            });
        }

        const response = await fetch(
            "https://graph.microsoft.com/v1.0/me/drive/root/children?$select=id,name,folder,webUrl",
            {
                method: "GET",
                headers: {
                    Authorization:
                        `Bearer ${session.accessToken}`,
                },
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error(
                "Microsoft Graph folder error:",
                response.status,
                data
            );

            return res.status(response.status).json({
                success: false,
                message:
                    data.error?.message ||
                    "Gagal mengambil folder OneDrive.",
            });
        }

        const folders = (data.value || [])
            .filter((item) => item.folder)
            .map((item) => ({
                id: item.id,
                name: item.name,
                webUrl: item.webUrl,
                childCount:
                    item.folder.childCount || 0,
            }));

        return res.status(200).json({
            success: true,
            account: session.username,
            folders,
        });

    } catch (error) {

        console.error(
            "OneDrive folders error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Gagal mengambil folder OneDrive.",
        });
    }
};