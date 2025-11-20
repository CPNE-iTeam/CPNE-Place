export class MediaPreviewManager {
    private mediaInput: HTMLInputElement;
    private previewContainer: HTMLElement;
    private backendConfig: any;

    constructor(mediaInput: HTMLInputElement, previewContainer: HTMLElement, backendConfig: any) {
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

        if (files.length > this.backendConfig.MaxImagesPerPost) {
            alert(`You can only select a maximum of ${this.backendConfig.MaxImagesPerPost} files.`);
            this.mediaInput.value = '';
            this.previewContainer.innerHTML = '';
            return;
        }

        for (let i = 0; i < files.length; i++) {
            if (files[i].size > this.backendConfig.MaxImageSize) {
                alert(`File "${files[i].name}" exceeds the maximum size of ${(this.backendConfig.MaxImageSize / 1024 / 1024).toFixed(2)} MB.`);
                this.mediaInput.value = '';
                this.previewContainer.innerHTML = '';
                return;
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

        const img = document.createElement('img');
        img.className = 'image-preview';

        const reader = new FileReader();
        reader.onload = (e) => {
            img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);

        const removeButton = document.createElement('button');
        removeButton.className = 'remove-image-button';
        removeButton.innerHTML = '×';
        removeButton.addEventListener('click', () => this.removePreview(index, file));

        previewItem.appendChild(img);
        previewItem.appendChild(removeButton);
        this.previewContainer.appendChild(previewItem);
    }

    private removePreview(index: number, file: File): void {
        const filesArray = Array.from(this.mediaInput.files || []);
        filesArray.splice(index, 1);

        const dataTransfer = new DataTransfer();
        filesArray.forEach((f) => dataTransfer.items.add(f));
        this.mediaInput.files = dataTransfer.files;

        this.handleFiles();
    }
}
