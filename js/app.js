const participantNames =
    document.getElementById("participantNames");

const previewSection =
    document.getElementById("previewSection");

const previewTableBody =
    document.getElementById("previewTableBody");

const progressSection =
    document.getElementById("progressSection");

const progressBar =
    document.getElementById("progressBar");

const progressText =
    document.getElementById("progressText");

const progressSummary =
    document.getElementById("progressSummary");

const progressBatchTime =
    document.getElementById("progressBatchTime");

const resultTableBody =
    document.getElementById("resultTableBody");

const retryButton =
    document.getElementById("retryButton");

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

            batchValidated = false;

            validateButton.innerHTML =
                'Preview & Validasi Data <span>→</span>';

            validateButton.classList.remove(
                "batch-ready"
            );

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
   Batch Processing
========================================= */

const MAX_WORKERS = 7;

let batchParticipants = [];
let batchResults = [];
let batchRunning = false;
let templateBase64Cache = null;
let batchValidated = false;
let batchStartTime = null;
let lastBatchDuration = null;


/* =========================================
   Helper: Format Waktu
========================================= */

function formatSeconds(milliseconds) {
    return `${(milliseconds / 1000).toFixed(2)} detik`;
}


/* =========================================
   Helper: Parse Daftar Peserta
========================================= */

function parseParticipantNames() {
    return participantNames.value
        .split(/\r?\n/)
        .map((name) => name.trim())
        .filter(Boolean);
}


/* =========================================
   Helper: Update Progress UI
========================================= */

function updateProgress() {
    const total = batchParticipants.length;
    const finished = batchResults.filter(
        (item) =>
            item.status === "SELESAI" ||
            item.status === "GAGAL"
    ).length;

    const success = batchResults.filter(
        (item) => item.status === "SELESAI"
    ).length;

    const failed = batchResults.filter(
        (item) => item.status === "GAGAL"
    ).length;

    const percent =
        total > 0
            ? Math.round((finished / total) * 100)
            : 0;

    progressBar.style.width = `${percent}%`;

    progressText.textContent =
        `${finished} dari ${total} selesai diproses (${percent}%)`;

    progressSummary.textContent =
        `Berhasil: ${success} · Gagal: ${failed} · Worker: ${MAX_WORKERS}`;

    if (progressBatchTime) {
        const elapsed =
            batchStartTime !== null
                ? performance.now() - batchStartTime
                : lastBatchDuration;

        progressBatchTime.textContent =
            `Waktu batch: ${
                elapsed !== null
                    ? formatSeconds(elapsed)
                    : "-"
            }`;
    }
}


/* =========================================
   Helper: Render Preview
========================================= */

function renderPreview(names) {
    previewTableBody.innerHTML = "";

    names.forEach((name, index) => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${index + 1}</td>
            <td></td>
        `;

        row.children[1].textContent = name;

        previewTableBody.appendChild(row);
    });

    previewSection.hidden = false;
}


/* =========================================
   Helper: Render Result
========================================= */

function renderResults() {
    resultTableBody.innerHTML = "";

    batchResults
        .slice()
        .sort((a, b) => a.index - b.index)
        .forEach((result) => {
            const row = document.createElement("tr");

            const statusClass =
                result.status === "SELESAI"
                    ? "success"
                    : result.status === "GAGAL"
                        ? "failed"
                        : "processing";

            row.innerHTML = `
                <td>${result.index + 1}</td>
                <td></td>
                <td>
                    <span class="batch-status ${statusClass}">
                        ${result.status}
                    </span>
                </td>
                <td>${result.duration ? formatSeconds(result.duration) : "-"}</td>
                <td class="batch-link-cell"></td>
                <td></td>
            `;

            row.children[1].textContent = result.name;

            if (result.webUrl) {
                const link = document.createElement("a");
                link.href = result.webUrl;
                link.target = "_blank";
                link.rel = "noopener noreferrer";
                link.textContent = "Buka PDF";
                row.children[4].appendChild(link);
            } else {
                row.children[4].textContent = "-";
            }

            row.children[5].textContent =
                result.error || "-";

            resultTableBody.appendChild(row);
        });
}


/* =========================================
   Helper: Read Template Once
========================================= */

async function prepareTemplateBase64() {
    if (templateBase64Cache) {
        return templateBase64Cache;
    }

    const template =
        templateFile.files[0];

    if (!template) {
        throw new Error(
            "Silakan upload template sertifikat terlebih dahulu."
        );
    }

    if (
        !template.name
            .toLowerCase()
            .endsWith(".pptx")
    ) {
        throw new Error(
            "Template harus menggunakan format PPTX."
        );
    }

    const arrayBuffer =
        await template.arrayBuffer();

    const bytes =
        new Uint8Array(arrayBuffer);

    let binary = "";

    const chunkSize = 0x8000;

    for (
        let i = 0;
        i < bytes.length;
        i += chunkSize
    ) {
        binary += String.fromCharCode(
            ...bytes.subarray(
                i,
                Math.min(
                    i + chunkSize,
                    bytes.length
                )
            )
        );
    }

    templateBase64Cache =
        btoa(binary);

    return templateBase64Cache;
}


/* =========================================
   Reset Template Cache
========================================= */

templateFile.addEventListener(
    "change",
    () => {
        templateBase64Cache = null;
        batchValidated = false;

        validateButton.innerHTML =
            'Preview & Validasi Data <span>→</span>';

        validateButton.classList.remove(
            "batch-ready"
        );
    }
);

participantNames.addEventListener(
    "input",
    () => {
        batchValidated = false;

        validateButton.innerHTML =
            'Preview & Validasi Data <span>→</span>';

        validateButton.classList.remove(
            "batch-ready"
        );
    }
);


/* =========================================
   Generate Satu Sertifikat
========================================= */

async function generateOneCertificate(
    participant,
    templateBase64
) {
    const startedAt =
        performance.now();

    const safeName =
        sanitizeFileName(
            participant.name
        );

    const fileName =
        `Sertifikat-${safeName}.pptx`;

    /*
     * 1. Generate PPTX
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
                        nama:
                            participant.name,
                        templateBase64,
                    }),
            }
        );

    if (
        generateResponse.status === 401
    ) {
        window.location.href =
            "/api/auth/login";

        throw new Error(
            "Session Microsoft kedaluwarsa."
        );
    }

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

        throw new Error(message);
    }

    /*
     * 2. Ambil PPTX
     */

    const generatedBlob =
        await generateResponse.blob();

    /*
     * 3. Convert ke Base64
     */

    const fileBase64 =
        await blobToBase64(
            generatedBlob
        );

    /*
     * 4. Upload PPTX ke OneDrive
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

    if (
        uploadResponse.status === 401
    ) {
        window.location.href =
            "/api/auth/login";

        throw new Error(
            "Session Microsoft kedaluwarsa."
        );
    }

    const uploadData =
        await uploadResponse.json();

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
     * 5. Convert PPTX → PDF
     */

    const convertResponse =
        await fetch(
            "/api/onedrive/convert-pdf",
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
                        deleteSource:
                            true,
                    }),
            }
        );

    if (
        convertResponse.status === 401
    ) {
        window.location.href =
            "/api/auth/login";

        throw new Error(
            "Session Microsoft kedaluwarsa."
        );
    }

    const convertData =
        await convertResponse.json();

    if (
        !convertResponse.ok ||
        !convertData.success
    ) {
        throw new Error(
            convertData.message ||
            "Gagal mengubah sertifikat menjadi PDF."
        );
    }

    return {
        status: "SELESAI",
        name: participant.name,
        index: participant.index,
        duration:
            performance.now() -
            startedAt,
        webUrl:
            convertData.pdfFile?.webUrl ||
            null,
        fileName:
            convertData.pdfFile?.name ||
            fileName.replace(
                /\.pptx$/i,
                ".pdf"
            ),
        error: null,
    };
}


/* =========================================
   Worker Batch
========================================= */

async function runBatchWorker(
    workerId,
    templateBase64,
    queue
) {
    while (true) {
        const participant =
            queue.shift();

        if (!participant) {
            return;
        }

        /*
         * Tandai sedang diproses
         */

        const current =
            batchResults.find(
                (item) =>
                    item.index ===
                    participant.index
            );

        if (current) {
            current.status =
                "DIPROSES";

            current.startedAt =
                performance.now();

            renderResults();
        }

        try {
            const result =
                await generateOneCertificate(
                    participant,
                    templateBase64
                );

            const target =
                batchResults.find(
                    (item) =>
                        item.index ===
                        participant.index
                );

            if (target) {
                Object.assign(
                    target,
                    result
                );
            }

            console.log(
                `[Worker ${workerId}] ${participant.name} selesai dalam ${formatSeconds(result.duration)}`
            );

        } catch (error) {
            const target =
                batchResults.find(
                    (item) =>
                        item.index ===
                        participant.index
                );

            if (target) {
                target.status =
                    "GAGAL";

                target.error =
                    error.message ||
                    "Gagal memproses sertifikat.";

                target.duration =
                    performance.now() -
                    target.startedAt;
            }

            console.error(
                `[Worker ${workerId}] ${participant.name} gagal:`,
                error
            );
        }

        updateProgress();
        renderResults();
    }
}


/* =========================================
   Jalankan Batch
========================================= */

async function startBatch(
    onlyFailed = false
) {
    if (batchRunning) {
        return;
    }

    if (!selectedFolder) {
        alert(
            "Silakan pilih folder OneDrive terlebih dahulu."
        );
        return;
    }

    if (!batchParticipants.length) {
        alert(
            "Belum ada peserta yang divalidasi."
        );
        return;
    }

    batchRunning = true;

    validateButton.disabled = true;
    retryButton.disabled = true;

    progressSection.hidden = false;

    try {
        validateButton.innerHTML =
            "Menyiapkan template...";

        const templateBase64 =
            await prepareTemplateBase64();

        let queue =
            batchParticipants.slice();

        if (onlyFailed) {
            queue =
                queue.filter(
                    (participant) => {
                        const result =
                            batchResults.find(
                                (item) =>
                                    item.index ===
                                    participant.index
                            );

                        return (
                            result &&
                            result.status ===
                                "GAGAL"
                        );
                    }
                );
        }

        if (!queue.length) {
            alert(
                "Tidak ada sertifikat gagal yang perlu diulang."
            );
            return;
        }

        /*
         * Reset status peserta yang akan
         * diproses ulang.
         */

        queue.forEach(
            (participant) => {
                const result =
                    batchResults.find(
                        (item) =>
                            item.index ===
                            participant.index
                    );

                if (result) {
                    result.status =
                        "DIPROSES";

                    result.error =
                        null;

                    result.webUrl =
                        null;
                }
            }
        );

        /*
         * Mulai timer total batch tepat sebelum
         * worker mulai memproses peserta.
         */
        batchStartTime = performance.now();
        lastBatchDuration = null;

        updateProgress();
        renderResults();

        validateButton.innerHTML =
            `Memproses ${queue.length} peserta...`;

        const workers = [];

        const workerCount =
            Math.min(
                MAX_WORKERS,
                queue.length
            );

        for (
            let i = 0;
            i < workerCount;
            i++
        ) {
            workers.push(
                runBatchWorker(
                    i + 1,
                    templateBase64,
                    queue
                )
            );
        }

        await Promise.all(
            workers
        );

        lastBatchDuration =
            performance.now() - batchStartTime;

        batchStartTime = null;

        updateProgress();
        renderResults();

        const successCount =
            batchResults.filter(
                (item) =>
                    item.status ===
                    "SELESAI"
            ).length;

        const failedCount =
            batchResults.filter(
                (item) =>
                    item.status ===
                    "GAGAL"
            ).length;

        retryButton.hidden =
            failedCount === 0;

        alert(
            `✓ Batch selesai.\n\n` +
            `Berhasil: ${successCount}\n` +
            `Gagal: ${failedCount}\n` +
            `Worker: ${workerCount}\n` +
            `Total waktu: ${formatSeconds(lastBatchDuration)}`
        );

    } catch (error) {
        console.error(
            "Batch error:",
            error
        );

        alert(
            `Batch gagal dijalankan.\n\n${error.message}`
        );

    } finally {
        batchRunning = false;

        validateButton.disabled =
            false;

        retryButton.disabled =
            false;

        validateButton.innerHTML =
            "Mulai Generate Sertifikat";
    }
}


/* =========================================
   Preview & Validasi Data
========================================= */

validateButton.addEventListener(
    "click",
    async () => {
        if (batchRunning) {
            return;
        }

        if (batchValidated) {
            await startBatch(false);
            return;
        }

        const names =
            parseParticipantNames();

        const template =
            templateFile.files[0];

        /*
         * Validasi template
         */

        if (!template) {
            alert(
                "Silakan upload template sertifikat terlebih dahulu."
            );
            return;
        }

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

        if (!names.length) {
            alert(
                "Masukkan minimal satu nama peserta."
            );

            participantNames.focus();

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

        /*
         * Batasi nama duplikat
         */

        const normalized =
            new Set();

        const duplicates = [];

        names.forEach(
            (name) => {
                const key =
                    name.toLowerCase();

                if (
                    normalized.has(key)
                ) {
                    duplicates.push(name);
                }

                normalized.add(key);
            }
        );

        if (duplicates.length) {
            alert(
                "Terdapat nama peserta yang duplikat:\n\n" +
                duplicates.join("\n") +
                "\n\nSilakan hapus duplikat sebelum melanjutkan."
            );

            return;
        }

        batchParticipants =
            names.map(
                (name, index) => ({
                    name,
                    index,
                })
            );

        batchResults =
            batchParticipants.map(
                (participant) => ({
                    index:
                        participant.index,
                    name:
                        participant.name,
                    status:
                        "BELUM",
                    duration: null,
                    webUrl: null,
                    error: null,
                    startedAt: null,
                })
            );

        renderPreview(
            names
        );

        renderResults();
        updateProgress();

        progressSection.hidden =
            false;

        retryButton.hidden =
            true;

        validateButton.innerHTML =
            "Mulai Generate Sertifikat";

        batchValidated = true;

        validateButton.classList.add(
            "batch-ready"
        );
    }
);


/* =========================================
   Retry Peserta Gagal
========================================= */

retryButton.addEventListener(
    "click",
    async () => {
        await startBatch(true);
    }
);
