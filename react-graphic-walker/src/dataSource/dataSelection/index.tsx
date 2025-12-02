import React from 'react';
import CSVData from './csvData';
import RemoteData from './remoteFile';
import { useTranslation } from 'react-i18next';
import { CommonStore } from '../../store/commonStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const DataSelection: React.FC<{ commonStore: CommonStore }> = (props) => {
    const { commonStore } = props;
    const { t } = useTranslation('translation', { keyPrefix: 'DataSource' });

    return (
        <div className="text-sm">
            <div className="mt-4">
                <Tabs defaultValue="file">
                    <TabsList>
                        <TabsTrigger value="file">{t('dialog.text_file_data')}</TabsTrigger>
                        <TabsTrigger value="remote">{t('dialog.remote_file_data')}</TabsTrigger>
                    </TabsList>
                    <TabsContent value="file">
                        <CSVData commonStore={commonStore} />
                    </TabsContent>
                    <TabsContent value="remote">
                        <RemoteData commonStore={commonStore} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default DataSelection;
