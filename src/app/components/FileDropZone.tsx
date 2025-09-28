import React, { useRef, useState, DragEvent } from "react";

type DropzoneProps = React.InputHTMLAttributes<HTMLInputElement> & {
    className?: string;
};

export default function FileDropzone({
    className,
    onChange,
    accept,
    multiple,
    ...rest
}: DropzoneProps) {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [files, setFiles] = useState<File[]>([]);

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files && inputRef.current) {
            const fileList = Array.from(e.dataTransfer.files).filter(f => accept?.split(",").some(ac => f.name.endsWith(ac.trim())));
            if (multiple) {
                setFiles(fileList);
            }
            else {
                setFiles([fileList[0]].filter(f => f));
            }
            const event = {
                ...e,
                target: { files: fileList },
            } as unknown as React.ChangeEvent<HTMLInputElement>;

            onChange?.(event);
        }
    };

    return (
        <div
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
                } ${className || ""}`}
            onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => {
                inputRef.current?.click()
            }}
        >
            <p className="text-gray-500">
                드래그 또는 클릭으로 파일을 가져오십시오. {`(${accept})`}
            </p>
            <input
                ref={inputRef}
                type="file"
                className="hidden"
                onChange={(e:React.ChangeEvent<HTMLInputElement>) => {
                    setFiles(Array.from(e.target.files ?? []))
                    onChange?.(e);
                }}
                accept={accept}
                multiple={multiple}
                {...rest}
            />
            {files.length > 0 && (
                <ul className="text-sm text-gray-700 list-disc list-inside">
                    {files.map((file, idx) => (
                        <li key={idx}>{file.name}</li>
                    ))}
                </ul>
            )}
        </div>
    );
}
