const participantName =
    document.getElementById("participantName");

const templateFile =
    document.getElementById("templateFile");

const templateFileInfo =
    document.getElementById("templateFileInfo");

const validateButton =
    document.getElementById("validateButton");

const selectDriveFolder =
    document.getElementById("selectDriveFolder");


/* =========================================
   Folder Picker Elements
========================================= */

const selectedFolderName =
    document.getElementById("selectedFolderName");

const selectedFolderDescription =
    document.getElementById(
        "selectedFolderDescription"
    );

const folderModal =
    document.getElementById("folderModal");

const folderModalOverlay =
    document.getElementById(
        "folderModalOverlay"
    );

const closeFolderModal =
    document.getElementById(
        "closeFolderModal"
    );

const folderBreadcrumb =
    document.getElementById(
        "folderBreadcrumb"
    );

const folderStatus =
    document.getElementById(
        "folderStatus"
    );

const folderList =
    document.getElementById(
        "folderList"
    );

const folderEmpty =
    document.getElementById(
        "folderEmpty"
    );

const currentFolderName =
    document.getElementById(
        "currentFolderName"
    );

const chooseCurrentFolder =
    document.getElementById(
        "chooseCurrentFolder"
    );


/* =========================================
   Folder Picker State
========================================= */

let currentFolder = {
    id: null,
    name: "OneDrive",
};

let folderStack = [];

let selectedFolder = null;


/* =========================================
   Menampilkan nama template yang dipilih
========================================= */

templateFile.addEventListener(
    "change",
    () => {

        const file =
            templateFile.files[0];

        if (!file) {

            templateFileInfo.hidden = true;

            return;
        }

        templateFileInfo.textContent =
            `✓ ${file.name}`;

        templateFileInfo.hidden = false;

    }
);


/* =========================================
   Membuka Folder Picker
========================================= */

selectDriveFolder.addEventListener(
    "click",
    async () => {

        openFolderModal();

        await loadFolder(
            null,
            "OneDrive",
            true
        );

    }
);


/* =========================================
   Membuka Modal
========================================= */

function openFolderModal() {

    folderModal.hidden = false;

    folderStack = [];

    currentFolder = {
        id: null,
        name: "OneDrive",
    };

    selectedFolder = null;

    renderBreadcrumb();

}


/* =========================================
   Menutup Modal
========================================= */

closeFolderModal.addEventListener(
    "click",
    closeFolderPicker
);

folderModalOverlay.addEventListener(
    "click",
    closeFolderPicker
);

function closeFolderPicker() {

    folderModal.hidden = true;

}


/* =========================================
   Load Folder OneDrive
========================================= */

async function loadFolder(
    parentId,
    folderName,
    resetStack = false
) {

    if (resetStack) {

        folderStack = [];

    }

    showFolderStatus(
        "Memuat folder OneDrive..."
    );

    folderList.innerHTML = "";

    folderEmpty.hidden = true;

    try {

        let url =
            "/api/onedrive/folders";

        if (parentId) {

            url +=
                `?parentId=${encodeURIComponent(
                    parentId
                )}`;

        }

        const response =
            await fetch(url);

        /*
         * Jika session Microsoft sudah
         * tidak tersedia / expired
         */
        if (response.status === 401) {

            window.location.href =
                "/api/auth/login";

            return;

        }

        const data =
            await response.json();

        if (!response.ok) {

            throw new Error(
                data.message ||
                "Gagal mengambil folder OneDrive."
            );

        }

        currentFolder = {
            id: parentId || null,
            name: folderName,
        };

        if (resetStack) {

            folderStack = [];

        }

        hideFolderStatus();

        renderBreadcrumb();

        renderFolders(
            data.folders || []
        );

        currentFolderName.textContent =
            currentFolder.name;

    } catch (error) {

        console.error(
            "Folder picker error:",
            error
        );

        showFolderStatus(
            error.message ||
            "Gagal mengambil folder OneDrive.",
            true
        );

    }

}


/* =========================================
   Render Daftar Folder
========================================= */

function renderFolders(
    folders
) {

    folderList.innerHTML = "";

    folderEmpty.hidden =
        folders.length !== 0;

    folders.forEach(
        (folder) => {

            const button =
                document.createElement(
                    "button"
                );

            button.type = "button";

            button.className =
                "folder-item";

            /*
             * Icon folder
             */
            const icon =
                document.createElement(
                    "div"
                );

            icon.className =
                "folder-icon";

            icon.textContent =
                "📁";

            /*
             * Informasi folder
             */
            const info =
                document.createElement(
                    "div"
                );

            info.className =
                "folder-info";

            const name =
                document.createElement(
                    "span"
                );

            name.className =
                "folder-name";

            name.textContent =
                folder.name;

            const meta =
                document.createElement(
                    "span"
                );

            meta.className =
                "folder-meta";

            if (
                folder.childCount > 0
            ) {

                meta.textContent =
                    `${folder.childCount} item`;

            } else {

                meta.textContent =
                    "Folder kosong";

            }

            info.appendChild(name);

            info.appendChild(meta);

            /*
             * Arrow
             */
            const arrow =
                document.createElement(
                    "div"
                );

            arrow.className =
                "folder-arrow";

            arrow.textContent =
                "›";

            button.appendChild(icon);

            button.appendChild(info);

            button.appendChild(arrow);

            /*
             * Klik folder
             */
            button.addEventListener(
                "click",
                async () => {

                    folderStack.push({
                        id: currentFolder.id,
                        name: currentFolder.name,
                    });

                    await loadFolder(
                        folder.id,
                        folder.name
                    );

                }
            );

            folderList.appendChild(
                button
            );

        }
    );

}


/* =========================================
   Render Breadcrumb
========================================= */

function renderBreadcrumb() {

    folderBreadcrumb.innerHTML = "";

    /*
     * Root OneDrive
     */
    const rootButton =
        document.createElement(
            "button"
        );

    rootButton.type = "button";

    rootButton.className =
        "breadcrumb-item";

    rootButton.textContent =
        "OneDrive";

    if (
        currentFolder.id === null
    ) {

        rootButton.classList.add(
            "active"
        );

    }

    rootButton.addEventListener(
        "click",
        async () => {

            if (
                currentFolder.id === null
            ) {

                return;

            }

            await loadFolder(
                null,
                "OneDrive",
                true
            );

        }
    );

    folderBreadcrumb.appendChild(
        rootButton
    );

    /*
     * Folder sebelumnya
     */
    folderStack.forEach(
        (folder, index) => {

            /*
             * Jangan tampilkan root
             * sebagai breadcrumb kedua
             */
            if (
                !folder.id &&
                index === 0
            ) {

                return;

            }

            const separator =
                document.createElement(
                    "span"
                );

            separator.className =
                "breadcrumb-separator";

            separator.textContent =
                "/";

            folderBreadcrumb.appendChild(
                separator
            );

            const button =
                document.createElement(
                    "button"
                );

            button.type = "button";

            button.className =
                "breadcrumb-item";

            button.textContent =
                folder.name;

            /*
             * Klik breadcrumb
             */
            button.addEventListener(
                "click",
                async () => {

                    const targetFolder =
                        folderStack[index];

                    /*
                     * Potong stack setelah
                     * folder yang dipilih
                     */
                    folderStack =
                        folderStack.slice(
                            0,
                            index
                        );

                    await loadFolder(
                        targetFolder.id,
                        targetFolder.name
                    );

                }
            );

            folderBreadcrumb.appendChild(
                button
            );

        }
    );

    /*
     * Tampilkan folder yang sedang aktif
     */
    if (
        currentFolder.id !== null
    ) {

        const separator =
            document.createElement(
                "span"
            );

        separator.className =
            "breadcrumb-separator";

        separator.textContent =
            "/";

        folderBreadcrumb.appendChild(
            separator
        );

        const currentButton =
            document.createElement(
                "button"
            );

        currentButton.type = "button";

        currentButton.className =
            "breadcrumb-item active";

        currentButton.textContent =
            currentFolder.name;

        folderBreadcrumb.appendChild(
            currentButton
        );

    }

}


/* =========================================
   Status Folder
========================================= */

function showFolderStatus(
    message,
    isError = false
) {

    folderStatus.hidden = false;

    folderStatus.textContent =
        message;

    folderStatus.classList.toggle(
        "error",
        isError
    );

}


function hideFolderStatus() {

    folderStatus.hidden = true;

    folderStatus.textContent = "";

    folderStatus.classList.remove(
        "error"
    );

}


/* =========================================
   Pilih Folder Saat Ini
========================================= */

chooseCurrentFolder.addEventListener(
    "click",
    () => {

        selectedFolder = {
            id: currentFolder.id,
            name: currentFolder.name,
        };

        selectedFolderName.textContent =
            selectedFolder.name;

        if (
            selectedFolder.id
        ) {

            selectedFolderDescription.textContent =
                "Folder OneDrive telah dipilih sebagai tujuan penyimpanan sertifikat.";

        } else {

            selectedFolderDescription.textContent =
                "Sertifikat akan disimpan pada folder utama OneDrive.";

        }

        closeFolderPicker();

    }
);


/* =========================================
   Helper: Convert Blob → Base64
========================================= */

function blobToBase64(blob) {

    return new Promise(
        (resolve, reject) => {

            const reader =
                new FileReader();

            reader.onload = () => {

                const result =
                    reader.result;

                /*
                 * Hasil FileReader berupa:
                 *
                 * data:application/...;base64,XXXXX
                 *
                 * Kita hanya mengambil bagian
                 * setelah koma.
                 */
                const base64 =
                    result.split(",")[1];

                resolve(base64);

            };

            reader.onerror = () => {

                reject(
                    new Error(
                        "Gagal mengubah file menjadi Base64."
                    )
                );

            };

            reader.readAsDataURL(blob);

        }
    );

}


/* =========================================
   Helper: Bersihkan Nama File
========================================= */

function sanitizeFileName(
    name
) {

    return name
        .replace(/[<>:"/\\|?*]/g, "")
        .replace(/\s+/g, " ")
        .trim();

}


/* =========================================
   Generate Sertifikat
========================================= */

validateButton.addEventListener(
    "click",
    async () => {

        const template =
            templateFile.files[0];

        const nama =
            participantName.value.trim();


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
        if (
            !template.name
                .toLowerCase()
                .endsWith(".pptx")
        ) {

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


        /*
         * Validasi folder
         */
        if (!selectedFolder) {

            alert(
                "Silakan pilih folder OneDrive terlebih dahulu."
            );

            selectDriveFolder.focus();

            return;
        }


        try {

            /*
             * Disable tombol
             */
            validateButton.disabled =
                true;


            /*
             * =====================================
             * STEP 1
             * Membuat sertifikat
             * =====================================
             */
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
                new Uint8Array(
                    arrayBuffer
                );

            let binary = "";


            for (
                let i = 0;
                i < bytes.length;
                i++
            ) {

                binary +=
                    String.fromCharCode(
                        bytes[i]
                    );

            }


            const templateBase64 =
                btoa(binary);


            /*
             * Kirim template dan nama
             * ke API generate-pptx
             */
            const generateResponse =
                await fetch(
                    "/api/generate-pptx",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body:
                            JSON.stringify({
                                nama,
                                templateBase64,
                            }),
                    }
                );


            /*
             * Cek response generate
             */
            if (
                !generateResponse.ok
            ) {

                let message =
                    "Gagal membuat sertifikat.";

                try {

                    const data =
                        await generateResponse.json();

                    message =
                        data.message ||
                        message;

                } catch {

                    // Response bukan JSON

                }

                throw new Error(
                    message
                );

            }


            /*
             * =====================================
             * STEP 2
             * Ambil PPTX hasil generate
             * =====================================
             */

            validateButton.innerHTML =
                "Menyiapkan file...";


            const generatedBlob =
                await generateResponse.blob();


            /*
             * =====================================
             * STEP 3
             * Convert PPTX → Base64
             * =====================================
             */

            validateButton.innerHTML =
                "Mengupload ke OneDrive...";


            const fileBase64 =
                await blobToBase64(
                    generatedBlob
                );


            /*
             * Nama file sertifikat
             */
            const safeName =
                sanitizeFileName(
                    nama
                );

            const fileName =
                `Sertifikat-${safeName}.pptx`;


            /*
             * =====================================
             * STEP 4
             * Upload ke OneDrive
             * =====================================
             */

            const uploadResponse =
                await fetch(
                    "/api/onedrive/upload",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body:
                            JSON.stringify({

                                parentId:
                                    selectedFolder.id,

                                fileName,

                                fileBase64,

                            }),
                    }
                );


            /*
             * Jika session Microsoft
             * sudah expired
             */
            if (
                uploadResponse.status === 401
            ) {

                window.location.href =
                    "/api/auth/login";

                return;

            }


            /*
             * Ambil response upload
             */
            const uploadData =
                await uploadResponse.json();


            /*
             * Cek upload
             */
            if (
                !uploadResponse.ok ||
                !uploadData.success
            ) {

                throw new Error(
                    uploadData.message ||
                    "Gagal mengupload sertifikat ke OneDrive."
                );

            }


            /*
             * =====================================
             * STEP 5
             * Upload berhasil
             * =====================================
             */

            const webUrl =
                uploadData.file?.webUrl;


            if (webUrl) {

                alert(
                    `✓ Sertifikat berhasil dibuat dan disimpan di OneDrive.\n\n` +
                    `File: ${uploadData.file.name}\n\n` +
                    `Folder: ${selectedFolder.name}`
                );

                /*
                 * Buka file OneDrive
                 * pada tab baru
                 */
                window.open(
                    webUrl,
                    "_blank"
                );

            } else {

                alert(
                    `✓ Sertifikat berhasil dibuat dan diupload ke OneDrive.\n\n` +
                    `File: ${uploadData.file?.name || fileName}`
                );

            }


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
             * Kembalikan tombol
             */
            validateButton.disabled =
                false;

            validateButton.innerHTML =
                'Preview & Validasi Data <span>→</span>';

        }

    }
);