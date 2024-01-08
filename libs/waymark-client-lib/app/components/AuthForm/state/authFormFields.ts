// email: string
import { create } from 'zustand';
import { shallow } from 'zustand/shallow';

export interface authFormFieldStore {
  email: string;
  updateEmail: (newEmail: string) => void;
  password: string;
  updatePassword: (newPassword: string) => void;
  companyName: string;
  updateCompanyName: (newCompanyName: string) => void;
  name: string;
  updateName: (newName: string) => void;
}

// Manages getting/setting field values in the auth form so that they can persist as the user switches between form views or closes and re-opens an auth modal
const useAuthFormFieldStore = create<authFormFieldStore>((set, get) => ({
  email: '',
  password: '',
  companyName: '',
  name: '',
  updateEmail: (newEmail: string) => set({ email: newEmail }),
  updatePassword: (newPassword: string) => set({ password: newPassword }),
  updateCompanyName: (newCompanyName: string) => set({ companyName: newCompanyName }),
  updateName: (newName: string) => set({ name: newName }),
}));

export const useEmailField = () =>
  useAuthFormFieldStore(
    (store): [string, authFormFieldStore['updateEmail']] => [store.email, store.updateEmail],
    shallow,
  );

export const usePasswordField = () =>
  useAuthFormFieldStore(
    (store): [string, authFormFieldStore['updatePassword']] => [
      store.password,
      store.updatePassword,
    ],
    shallow,
  );

export const useCompanyNameField = () =>
  useAuthFormFieldStore(
    (store): [string, authFormFieldStore['updateCompanyName']] => [
      store.companyName,
      store.updateCompanyName,
    ],
    shallow,
  );

export const useNameField = () =>
  useAuthFormFieldStore(
    (store): [string, authFormFieldStore['updateName']] => [store.name, store.updateName],
    shallow,
  );
