import type { GlobalConfig } from "./models/global_config";

export class MediaPreviewManager {
    private mediaInput: HTMLInputElement;
    private previewContainer: HTMLElement;
    private backendConfig: GlobalConfig;

    constructor(mediaInput: HTMLInputElement, previewContainer: HTMLElement, backendConfig: GlobalConfig) {
        this.mediaInput = mediaInput;
        this.previewContainer = previewContainer;
        this.backendConfig = backendConfig;
        this.setupEventListener();
    }

    private setupEventListener(): void {
        this.mediaInput.addEventListener('change', () => this.handleFiles());
    }

    private handleFiles(): void {
        const files = this.mediaInput.files;
        if (!files || files.length === 0) return;

        if (files.length > this.backendConfig.MaxMediasPerPost) {
            alert(`You can only select a maximum of ${this.backendConfig.MaxMediasPerPost} files.`);
            this.mediaInput.value = '';
            this.previewContainer.innerHTML = '';
            return;
        }

        for (let i = 0; i < files.length; i++) {
            if (!this.backendConfig.AllowedImageTypes.includes(files[i].type) && !this.backendConfig.AllowedVideoTypes.includes(files[i].type)) {
                alert(`File "${files[i].name}" is not an allowed media type.`);
                this.mediaInput.value = '';
                return;
            }

            if (this.backendConfig.AllowedImageTypes.includes(files[i].type)) {
                if (files[i].size > this.backendConfig.MaxImageSize) {
                    alert(`File "${files[i].name}" exceeds the maximum size of ${(this.backendConfig.MaxImageSize / 1024 / 1024).toFixed(2)} MB.`);
                    this.mediaInput.value = '';
                    this.previewContainer.innerHTML = '';
                    return;
                }
            }

            if (this.backendConfig.AllowedVideoTypes.includes(files[i].type)) {
                if (files[i].size > this.backendConfig.MaxVideoSize) {
                    alert(`File "${files[i].name}" exceeds the maximum size of ${(this.backendConfig.MaxVideoSize / 1024 / 1024).toFixed(2)} MB.`);
                    this.mediaInput.value = '';
                    this.previewContainer.innerHTML = '';
                    return;
                }
            }
        }

        this.previewContainer.innerHTML = '';
        for (let i = 0; i < files.length; i++) {
            this.createPreview(files[i], i);
        }
    }

    private createPreview(file: File, index: number): void {
        const previewItem = document.createElement('div');
        previewItem.className = 'image-preview-item';

        const isImage = this.backendConfig.AllowedImageTypes.includes(file.type);
        const isVideo = this.backendConfig.AllowedVideoTypes.includes(file.type);

        const objectUrl = URL.createObjectURL(file);

        if (isImage) {
            const img = document.createElement('img');
            img.className = 'image-preview';
            img.src = objectUrl;
            img.onload = () => {
                try { URL.revokeObjectURL(objectUrl); } catch { /* noop */ }
            };
            previewItem.appendChild(img);
        } else if (isVideo) {
            const video = document.createElement('video');
            video.className = 'video-preview';
            video.controls = true;
            video.preload = 'metadata';
            video.src = objectUrl;
            // Revoke when metadata or first frame is loaded
            video.onloadeddata = () => {
                try { URL.revokeObjectURL(objectUrl); } catch { /* noop */ }
            };
            previewItem.appendChild(video);
        }

        const removeButton = document.createElement('button');
        removeButton.className = 'remove-image-button';
        removeButton.innerHTML = '×';
        removeButton.addEventListener('click', () => this.removePreview(index, file));

        previewItem.appendChild(removeButton);
        this.previewContainer.appendChild(previewItem);
    }

    private removePreview(index: number, file: File): void {
        const child = this.previewContainer.children[index] as HTMLElement | undefined;
        if (child) {
            child.remove();
        }

        const filesArray = Array.from(this.mediaInput.files || []);
        filesArray.splice(index, 1);

        const dataTransfer = new DataTransfer();
        filesArray.forEach((f) => dataTransfer.items.add(f));
        this.mediaInput.files = dataTransfer.files;

        this.handleFiles();
    }
}
