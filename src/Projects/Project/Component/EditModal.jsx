import styles from '../Serviced_and_Schedule.module.css';

const EditModal = ({ showModal, formData, handleInputChange, handleSubmit, setShowModal }) => {
  if (!showModal) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h3>Update Info ({formData.projectName})</h3>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            <div className={styles.inputField}>
              <label>Last Servicing Date:</label>
              <input 
                type="date" 
                name="lastServicingDate" 
                value={formData.lastServicingDate} 
                onChange={handleInputChange} 
              />
            </div>
            <div className={styles.inputField}>
              <label>Servicing Status:</label>
              <select 
                name="servicingStatus" 
                value={formData.servicingStatus} 
                onChange={handleInputChange}
              >
                <option value="Pending">Pending</option>
                <option value="Complete">Complete</option>
              </select>
            </div>
            <div className={styles.inputField}>
              <label>Collected Bill Amount :</label>
              <input 
                type="number" 
                name="collectedBill" 
                placeholder="Collected Bill" 
                value={formData.collectedBill} 
                onChange={handleInputChange} 
              />
            </div>
            <div className={styles.inputField}>
              <label>Collected By:</label>
              <input 
                type="text" 
                name="collectedBy" 
                placeholder="Collected By" 
                value={formData.collectedBy} 
                onChange={handleInputChange} 
              />
            </div>
          </div>
          <div className={styles.modalActions}>
            <button type="submit" className={styles.btnSave}>Update Info</button>
            <button type="button" className={styles.btnCancel} onClick={() => setShowModal(false)}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditModal;