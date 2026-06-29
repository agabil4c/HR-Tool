import { useCallback, useEffect, useState } from 'react';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import PageMeta from '@/components/PageMeta';
import { hrApi } from '@/services/hrApi';
import HolidaysLeaveDeleteModal from './components/HolidaysLeaveDeleteModal';
import HoliyDays from './components/HoliyDays';
import HoliydaysAdd from './components/HoliydaysAdd';

const Index = () => {
  const [holidayRows, setHolidayRows] = useState([]);
  const [isSyncingAnnual, setIsSyncingAnnual] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  const loadHolidays = useCallback(async () => {
    try {
      const data = await hrApi.getModuleData('holidays');
      setHolidayRows(data.holidays || []);
    } catch (error) {
      console.error('Failed to load holidays module data', error);
    }
  }, []);

  const syncAnnualHolidays = useCallback(async () => {
    const year = new Date().getFullYear();

    try {
      setIsSyncingAnnual(true);
      setSyncMessage('');

      const result = await hrApi.importAnnualPublicHolidays({
        year,
        includeGlobal: true
      });

      await loadHolidays();
      setSyncMessage(`Annual sync completed for ${result.countryCode} ${result.regionCode ? `(${result.regionCode})` : ''} - ${result.created} new holidays added.`);
    } catch (error) {
      setSyncMessage(error?.detail || error?.message || 'Failed to sync annual holidays.');
    } finally {
      setIsSyncingAnnual(false);
    }
  }, [loadHolidays]);

  useEffect(() => {
    loadHolidays();
  }, [loadHolidays]);

  const handleOpenAddModal = useCallback(() => {
    setSelectedRecord(null);
    setIsEditorOpen(true);
  }, []);

  const handleEditRecord = useCallback(record => {
    setSelectedRecord(record);
    setIsEditorOpen(true);
  }, []);

  const handleDeleteRecord = useCallback(record => {
    setSelectedRecord(record);
    setIsDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!selectedRecord) {
      return;
    }

    try {
      setIsDeleting(true);

      if (selectedRecord.sourceType === 'event') {
        await hrApi.deleteCalendarEvent(selectedRecord.recordId);
      } else {
        await hrApi.deletePublicHoliday(selectedRecord.recordId);
      }

      await loadHolidays();
      setSelectedRecord(null);
      setIsDeleteModalOpen(false);
    } catch (error) {
      setSyncMessage(error?.detail || error?.message || 'Failed to delete record.');
    } finally {
      setIsDeleting(false);
    }
  }, [loadHolidays, selectedRecord]);

  return <>
      <PageMeta title="Holidays" />
      <main>
        <PageBreadcrumb title="Holidays" subtitle="Menu" />
        <HoliyDays holidayRows={holidayRows} onOpenAddModal={handleOpenAddModal} onEditRecord={handleEditRecord} onDeleteRecord={handleDeleteRecord} onSyncAnnual={syncAnnualHolidays} isSyncingAnnual={isSyncingAnnual} syncMessage={syncMessage} />
      </main>
      <HolidaysLeaveDeleteModal isOpen={isDeleteModalOpen} selectedRecord={selectedRecord} onClose={() => {
      setIsDeleteModalOpen(false);
      setSelectedRecord(null);
    }} onConfirmDelete={handleConfirmDelete} isDeleting={isDeleting} />
      <HoliydaysAdd isOpen={isEditorOpen} selectedRecord={selectedRecord?.sourceType === 'event' || selectedRecord?.sourceType === 'holiday' ? selectedRecord : null} onClose={() => {
      setIsEditorOpen(false);
      setSelectedRecord(null);
    }} onSaved={async () => {
      await loadHolidays();
      setIsEditorOpen(false);
      setSelectedRecord(null);
    }} />
    </>;
};
export default Index;