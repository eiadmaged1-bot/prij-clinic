import { GuidelinesLibraryWorkspace } from "./GuidelinesLibraryWorkspace";
import styles from "./GuidelinesLibraryWorkspace.module.css";

export default function GuidelinesPage() {
  return (
    <div className={styles.workspace}>
      <GuidelinesLibraryWorkspace />
    </div>
  );
}
