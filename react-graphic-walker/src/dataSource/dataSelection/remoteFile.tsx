import { useTranslation } from 'react-i18next';
import { observer } from 'mobx-react-lite';
import { Button } from '@/components/ui/button';
import { FileReader as CSVFileReader } from '@kanaries/web-data-loader';
import { CommonStore } from '../../store/commonStore';
import React, { useState } from 'react';
import DropdownSelect from '../../components/dropdownSelect';
import { charsetOptions } from './config';

interface IRemoteDataProps {
    commonStore: CommonStore;
    ckanResourceUrl?: string;
}

const RemoteData: React.FC<IRemoteDataProps> = ({ commonStore, ckanResourceUrl }) => {
    // const { tmpDataSource } = commonStore;
    const inputRef = React.useRef<HTMLInputElement>(null);
    const { t } = useTranslation('translation', { keyPrefix: 'DataSource.dialog.remote' });

    const [encoding, setEncoding] = useState<string>('utf-8');
    const [downloading, setDownloading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

    const downloadRemoteFile = async (url: string) => {
        setDownloading(true);
        setProgress(0);
        setError(null);

        try {
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(t('fetch_error', { status: response.status }));
            }

            const contentLength = response.headers.get('content-length');
            const total = contentLength ? parseInt(contentLength, 10) : 0;

            const contentType = response.headers.get('content-type') || '';
            // Allow both CSV and JSON, though primarily checking for text/csv or application/json might be good.
            // For now, let's stick to the previous check but maybe relax it or just warn?
            // The previous code checked for 'text/csv'. Let's keep it simple for now but allow if it's not strictly rejected.

            const reader = response.body?.getReader();
            if (!reader) throw new Error(t('fetch_failed', { error: 'no_stream' }));

            let received = 0;
            const chunks: Uint8Array[] = [];

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                if (value) {
                    received += value.length;
                    if (received > MAX_SIZE) {
                        reader.cancel();
                        throw new Error(t('file_too_large', { maxSize: '10 MB' }));
                    }
                    chunks.push(value);
                    if (total > 0) {
                        setProgress(Math.min(100, Math.round((received / total) * 100)));
                    }
                }
            }

            // Merge chunks
            const full = new Uint8Array(received);
            let offset = 0;
            for (const chunk of chunks) {
                full.set(chunk, offset);
                offset += chunk.length;
            }

            const blob = new Blob([full], { type: 'text/csv' });
            const fakeFile = new File([blob], "remote.csv", { type: 'text/csv' });

            const data = await CSVFileReader.csvReader({
                file: fakeFile,
                config: { type: 'reservoirSampling', size: Infinity },
                encoding: encoding
            }) as any;

            commonStore.updateTempDS(data);
            commonStore.commitTempDS();

        } catch (error: any) {
            console.error("Error fetching remote file:", error);
            setError(error.message || 'Unknown error');
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div>
            {ckanResourceUrl && (
                <div className="mb-4 p-3 border rounded bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-2">
                        {t('ckan_resource_available')}
                    </p>
                    <Button
                        className="w-full"
                        disabled={downloading}
                        onClick={() => downloadRemoteFile(ckanResourceUrl)}
                    >
                        {downloading ? t('downloading') : (t('load_ckan_resource'))}
                    </Button>
                </div>
            )}

            <div className="flex gap-2 mb-2">
                <input
                    ref={inputRef}
                    id="remote-file-url"
                    type="text"
                    className="flex-grow p-2 border rounded text-sm"
                    placeholder={t('url_placeholder')}
                    disabled={downloading}
                />
                 <div className="w-32">
                    <DropdownSelect
                        className="w-full"
                        options={charsetOptions}
                        selectedKey={encoding}
                        onSelect={(k) => setEncoding(k)}
                        disable={downloading}
                    />
                </div>
            </div>

            {error && (
                <div className="text-red-500 text-sm mb-2">
                    {error}
                </div>
            )}

            {downloading && (
                <div className="mb-2">
                    <div className="text-xs text-muted-foreground mb-1">
                        {progress > 0 ? `${t('downloading')} ${progress}%` : t('downloading')}
                    </div>
                    <div className="h-2 w-full bg-secondary rounded overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}

            <Button
                className="my-1"
                disabled={downloading}
                onClick={() => {
                    const url = inputRef.current?.value;
                    if (url) downloadRemoteFile(url);
                }}
            >
                {downloading ? t('downloading') : t('submit')}
            </Button>
        </div>
    );
};

export default observer(RemoteData);
