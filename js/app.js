const participantName = document.getElementById("participantName");

const templateFile = document.getElementById("templateFile");
const templateFileInfo = document.getElementById("templateFileInfo");

const validateButton = document.getElementById("validateButton");

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
 * Generate sertifikat
 */
validateButton.addEventListener("click", async () => {

    const template = templateFile.files[0];
    const nama = participantName.value.trim();


    /*
     * Validasi template
     */
    if (!template) {

        alert(
            "Silakan upload template sertifikat terlebih dahulu."
        );

        return;
    }


    /*
     * Validasi format file
     */
    if (!template.name.toLowerCase().endsWith(".pptx")) {

        alert(
            "Template harus menggunakan format PPTX."
        );

        return;
    }


    /*
     * Validasi nama peserta
     */
    if (!nama) {

        alert(
            "Silakan masukkan nama peserta."
        );

        participantName.focus();

        return;
    }


    try {

        /*
         * Ubah status tombol
         */
        validateButton.disabled = true;

        validateButton.innerHTML =
            "Membuat sertifikat...";


        /*
         * Baca file PPTX
         */
        const arrayBuffer =
            await template.arrayBuffer();


        /*
         * Convert ArrayBuffer → Base64
         */
        const bytes =
            new Uint8Array(arrayBuffer);

        let binary = "";


        for (let i = 0; i < bytes.length; i++) {

            binary += String.fromCharCode(
                bytes[i]
            );

        }


        const templateBase64 =
            btoa(binary);


        /*
         * Kirim template dan nama
         * ke API generate-pptx
         */
        const response =
            await fetch(
                "/api/generate-pptx",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                    },

                    body: JSON.stringify({
                        nama,
                        templateBase64,
                    }),
                }
            );


        /*
         * Cek response API
         */
        if (!response.ok) {

            let message =
                "Gagal membuat sertifikat.";


            try {

                const data =
                    await response.json();

                message =
                    data.message || message;

            } catch {

                // Response bukan JSON

            }


            throw new Error(message);
        }


        /*
         * Ambil file hasil dari API
         */
        const blob =
            await response.blob();


        /*
         * Buat URL sementara
         */
        const url =
            URL.createObjectURL(blob);


        /*
         * Buat link download
         */
        const link =
            document.createElement("a");

        link.href = url;

        link.download =
            `Sertifikat-${nama}.pptx`;


        document.body.appendChild(link);

        link.click();

        link.remove();


        /*
         * Hapus URL sementara
         */
        URL.revokeObjectURL(url);


        /*
         * Beri informasi ke user
         */
        alert(
            "✓ Sertifikat berhasil dibuat."
        );

    } catch (error) {

        console.error(
            "Generate certificate error:",
            error
        );


        alert(
            `Gagal membuat sertifikat:\n${error.message}`
        );

    } finally {

        /*
         * Kembalikan tombol ke kondisi awal
         */
        validateButton.disabled = false;

        validateButton.innerHTML =
            'Preview & Validasi Data <span>→</span>';

    }

});