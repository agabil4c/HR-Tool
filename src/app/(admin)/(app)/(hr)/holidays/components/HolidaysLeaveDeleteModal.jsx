import deleteImg from '@/assets/images/delete.png';
import { LuX } from 'react-icons/lu';

const HolidaysLeaveDeleteModal = ({ isOpen, selectedRecord, onClose, onConfirmDelete, isDeleting = false }) => {
  if (!isOpen) {
    return null;
  }

  return <div className="fixed inset-0 z-80 bg-black/40 flex items-center justify-center p-3" role="dialog" tabIndex={-1} aria-labelledby="holidaysLeaveDeleteModal-label">
        <div className="md:w-sm w-full flex flex-col card shadow-2xs border border-default-200 rounded-xl pointer-events-auto px-6 py-8 relative bg-white">
          <div className="absolute top-3 end-3">
            <button type="button" className="size-5 text-default-800" aria-label="Close" onClick={onClose}>
              <span className="sr-only">Close</span>
              <LuX className="size-5" />
            </button>
          </div>
          <h3 className="font-semibold text-base text-default-800  text-center">
            <img src={deleteImg} alt="" className="size-12 mx-auto" />
            <div className="mt-5 text-center">
              <h5 className="mb-1 text-lg font-semibold text-default-800">Are you sure?</h5>
              <p className="text-default-500 text-sm font-normal">
                {selectedRecord ? `Delete ${selectedRecord.kind?.toLowerCase() || 'record'} "${selectedRecord.name}"?` : 'Are you certain you want to delete this record?'}
              </p>
              <div className="mt-5 flex gap-2 justify-center">
                <button type="button" className="btn text-danger bg-transparent hover:bg-danger/10" aria-label="Close" onClick={onClose}>
                  Cancel
                </button>
                <button type="button" onClick={onConfirmDelete} disabled={isDeleting || !selectedRecord} className="btn bg-danger text-white disabled:opacity-60">{isDeleting ? 'Deleting...' : 'Yes,Delete It!'}</button>
              </div>
            </div>
          </h3>
        </div>
    </div>;
};
export default HolidaysLeaveDeleteModal;