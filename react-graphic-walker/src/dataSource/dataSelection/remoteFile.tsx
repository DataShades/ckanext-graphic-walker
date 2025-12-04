import { useTranslation } from 'react-i18next';
import { observer } from 'mobx-react-lite';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileReader as CSVFileReader } from '@kanaries/web-data-loader';
import { CommonStore } from '../../store/commonStore';
import React, { useState, useCallback } from 'react';
import DropdownSelect from '../../components/dropdownSelect';
import { charsetOptions } from './config';
import Table from '../table';

interface IRemoteDataProps {
    commonStore: CommonStore;
    ckanResourceUrl?: string;
}

const RemoteData: React.FC<IRemoteDataProps> = ({ commonStore, ckanResourceUrl }) => {
    const { tmpDSName, tmpDataSource, tmpDSRawFields } = commonStore;
    const inputRef = React.useRef<HTMLInputElement>(null);
    const { t } = useTranslation('translation', { keyPrefix: 'DataSource.dialog.remote' });

    const [encoding, setEncoding] = useState<string>('utf-8');
    const [downloading, setDownloading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

    const fileLoaded = tmpDataSource.length > 0 && tmpDSRawFields.length > 0;

    const downloadRemoteFile = async (url: string) => {
        setDownloading(true);
        setProgress(0);
        setError(null);

        try {
            const response = await fetch(url);

            if (!response.ok) throw new Error(t('fetch_error', { status: response.status }));

            const contentLength = response.headers.get('content-length');
            const total = contentLength ? parseInt(contentLength, 10) : 0;
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

            if (!data.length) {
                throw new Error(t('fetch_failed'));
            }

            // Only update temp data, don't commit yet (preview mode)
            commonStore.updateTempDS(data);

        } catch (error: any) {
            console.error("Error fetching remote file:", error);
            setError(error.message || 'Unknown error');
        } finally {
            setDownloading(false);
        }
    };

    const onSubmitData = useCallback(() => {
        commonStore.commitTempDS();
    }, [commonStore]);

    return (
        <div className="min-h-[300px]">
            {!fileLoaded && ckanResourceUrl && (
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

            {!fileLoaded && (
                <>
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
                        {downloading ? t('downloading') : t('download')}
                    </Button>
                </>
            )}

            {fileLoaded && (
                <div className="mb-2 mt-6">
                    <label className="block text-xs text-secondary-foreground mb-1 font-bold">{t('dataset_name')}</label>
                    <div className="flex space-x-2">
                        <Input
                            type="text"
                            placeholder={t('dataset_name')}
                            value={tmpDSName}
                            onChange={(e) => {
                                commonStore.updateTempName(e.target.value);
                            }}
                            className="text-xs placeholder:italic w-36"
                        />
                        <Button
                            disabled={tmpDataSource.length === 0}
                            onClick={() => {
                                onSubmitData();
                            }}
                        >
                            {t('submit')}
                        </Button>
                    </div>
                </div>
            )}
            {fileLoaded && <Table commonStore={commonStore} />}
        </div>
    );
};

export default observer(RemoteData);
