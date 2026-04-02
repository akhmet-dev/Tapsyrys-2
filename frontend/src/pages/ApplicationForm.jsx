import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  createApplication,
  fetchApplicationById,
  getPublicFileUrl,
  updateApplication,
} from '../services/applicationService';
import { getErrorMessage } from '../services/api';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';
import Navbar from '../components/Navbar';
import useTranslation from '../hooks/useTranslation';
import useAuth from '../hooks/useAuth';
import {
  FACULTY_OPTIONS,
  FUNDING_TYPE_OPTIONS,
  SPECIALITY_OPTIONS,
  STUDY_TYPE_OPTIONS,
  getLocalizedValue,
} from '../utils/localization';

const GRADUATION_YEARS = [2025, 2024, 2023, 2022, 2021, 2020];

const INITIAL_FORM_DATA = {
  faculty: '',
  speciality: '',
  entExamScore: '',
  studyType: '',
  fundingType: '',
  priority: '1',
  birthDate: '',
  citizenship: 'kazakhstan',
  gender: '',
  address: '',
  phone: '',
  schoolName: '',
  graduationYear: '',
  gpa: '',
  hasIelts: false,
  ieltsScore: '',
  hasToefl: false,
  toeflScore: '',
  hasOlympiad: false,
  olympiadLevel: '',
  hasSports: false,
  hasOtherCertificates: false,
};

const createEmptyDocumentsState = () => ({
  identityDocument: null,
  diplomaDocument: null,
  photoDocument: null,
  entCertificateDocument: null,
  languageCertificateDocument: null,
  otherDocuments: [],
});

const formatFileSize = (bytes) => {
  if (typeof bytes !== 'number' || Number.isNaN(bytes) || bytes <= 0) {
    return '—';
  }

  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const normalizeDocument = (document, isExisting = true) => ({
  id: document._id || document.id || '',
  name: document.name || '',
  slotKey: document.slotKey || '',
  originalName: document.originalName || document.name || '',
  url: document.url || '',
  size: document.size || 0,
  file: document.file || null,
  isExisting,
});

const resolveDocumentSlotKey = (document = {}) => {
  if (document.slotKey) {
    return document.slotKey;
  }

  const name = document.name || '';

  if (name === 'Жеке куәлік') return 'identityDocument';
  if (name === 'Аттестат/Диплом' || name === 'Аттестат') return 'diplomaDocument';
  if (name === 'Фото 3x4' || name === 'Фото') return 'photoDocument';
  if (name === 'ЕНТ сертификаты') return 'entCertificateDocument';
  if (name === 'IELTS/TOEFL сертификаты') return 'languageCertificateDocument';
  return 'otherDocuments';
};

const buildDocumentsStateFromApplication = (documents = []) => {
  const nextState = createEmptyDocumentsState();

  documents.forEach((document) => {
    const slotKey = resolveDocumentSlotKey(document);
    const normalizedDocument = normalizeDocument({ ...document, slotKey });

    if (slotKey === 'otherDocuments') {
      nextState.otherDocuments.push(normalizedDocument);
      return;
    }

    nextState[slotKey] = normalizedDocument;
  });

  return nextState;
};

const ApplicationForm = () => {
  const navigate = useNavigate();
  const { id: applicationId } = useParams();
  const { t, language } = useTranslation();
  const { currentUser, updateCurrentUser } = useAuth();

  const isEditMode = Boolean(applicationId);
  const fileInputRefs = useRef({});

  const [formData, setFormData] = useState({
    ...INITIAL_FORM_DATA,
    phone: currentUser?.phone || '',
  });
  const [documents, setDocuments] = useState(createEmptyDocumentsState);
  const [isLoadingData, setIsLoadingData] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (!isEditMode && currentUser?.phone) {
      setFormData((prev) => ({ ...prev, phone: prev.phone || currentUser.phone }));
    }
  }, [currentUser?.phone, isEditMode]);

  useEffect(() => {
    if (!isEditMode) return;

    const loadApplicationData = async () => {
      try {
        const response = await fetchApplicationById(applicationId);
        const application = response.data;

        setFormData({
          faculty: application.faculty || '',
          speciality: application.speciality || '',
          entExamScore: application.entExamScore?.toString() || '',
          studyType: application.studyType || '',
          fundingType: application.fundingType || '',
          priority: String(application.priority || 1),
          birthDate: application.birthDate ? new Date(application.birthDate).toISOString().slice(0, 10) : '',
          citizenship: application.citizenship || 'kazakhstan',
          gender: application.gender || '',
          address: application.address || '',
          phone: currentUser?.phone || application.applicant?.phone || '',
          schoolName: application.schoolName || '',
          graduationYear: application.graduationYear?.toString() || '',
          gpa: application.gpa?.toString() || '',
          hasIelts: Boolean(application.certificates?.ielts?.enabled),
          ieltsScore: application.certificates?.ielts?.score?.toString() || '',
          hasToefl: Boolean(application.certificates?.toefl?.enabled),
          toeflScore: application.certificates?.toefl?.score?.toString() || '',
          hasOlympiad: Boolean(application.certificates?.olympiad?.enabled),
          olympiadLevel: application.certificates?.olympiad?.level || '',
          hasSports: Boolean(application.certificates?.sports?.enabled),
          hasOtherCertificates: Boolean(application.certificates?.other?.enabled),
        });
        setDocuments(buildDocumentsStateFromApplication(application.documents || []));
      } catch (error) {
        setErrorMessage(getErrorMessage(error));
      } finally {
        setIsLoadingData(false);
      }
    };

    loadApplicationData();
  }, [applicationId, currentUser?.phone, isEditMode]);

  const availableSpecialities = useMemo(
    () => (formData.faculty ? SPECIALITY_OPTIONS[formData.faculty] || [] : []),
    [formData.faculty]
  );

  const needsLanguageCertificate = formData.hasIelts || formData.hasToefl;

  const documentSlotConfig = useMemo(() => ([
    {
      key: 'identityDocument',
      label: t('appForm.documents.identity'),
      required: true,
      accept: '.pdf,.jpg,.jpeg,.png',
      multiple: false,
    },
    {
      key: 'diplomaDocument',
      label: t('appForm.documents.diploma'),
      required: true,
      accept: '.pdf,.jpg,.jpeg,.png',
      multiple: false,
    },
    {
      key: 'photoDocument',
      label: t('appForm.documents.photo'),
      required: true,
      accept: '.jpg,.jpeg,.png',
      multiple: false,
    },
    {
      key: 'entCertificateDocument',
      label: t('appForm.documents.entCertificate'),
      required: true,
      accept: '.pdf,.jpg,.jpeg,.png',
      multiple: false,
    },
    {
      key: 'languageCertificateDocument',
      label: t('appForm.documents.languageCertificate'),
      required: needsLanguageCertificate,
      accept: '.pdf,.jpg,.jpeg,.png',
      multiple: false,
      hidden: !needsLanguageCertificate,
    },
    {
      key: 'otherDocuments',
      label: t('appForm.documents.otherDocuments'),
      required: false,
      accept: '.pdf,.jpg,.jpeg,.png',
      multiple: true,
    },
  ]), [needsLanguageCertificate, t]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => {
      if (name === 'faculty') {
        return { ...prev, faculty: value, speciality: '' };
      }

      return { ...prev, [name]: value };
    });

    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    setErrorMessage('');
  };

  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target;

    setFormData((prev) => {
      const nextState = { ...prev, [name]: checked };

      if (name === 'hasIelts' && !checked) nextState.ieltsScore = '';
      if (name === 'hasToefl' && !checked) nextState.toeflScore = '';
      if (name === 'hasOlympiad' && !checked) nextState.olympiadLevel = '';
      if ((name === 'hasIelts' || name === 'hasToefl') && !checked && !prev[name === 'hasIelts' ? 'hasToefl' : 'hasIelts']) {
        setDocuments((current) => ({ ...current, languageCertificateDocument: null }));
      }

      return nextState;
    });

    setFieldErrors((prev) => ({
      ...prev,
      [name]: '',
      ieltsScore: name === 'hasIelts' && !checked ? '' : prev.ieltsScore,
      toeflScore: name === 'hasToefl' && !checked ? '' : prev.toeflScore,
      olympiadLevel: name === 'hasOlympiad' && !checked ? '' : prev.olympiadLevel,
      languageCertificateDocument: (name === 'hasIelts' || name === 'hasToefl') && !checked ? '' : prev.languageCertificateDocument,
    }));
  };

  const validateSelectedFiles = (files = []) => {
    const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png'];

    for (const file of files) {
      if (!allowedMimeTypes.includes(file.type)) {
        return t('appForm.validation.fileType');
      }

      if (file.size > 50 * 1024 * 1024) {
        return t('appForm.validation.fileSize');
      }
    }

    return '';
  };

  const handleFileSelect = (slotKey, fileList) => {
    const files = Array.from(fileList || []);
    const validationMessage = validateSelectedFiles(files);

    if (validationMessage) {
      setFieldErrors((prev) => ({ ...prev, [slotKey]: validationMessage }));
      return;
    }

    setDocuments((prev) => {
      if (slotKey === 'otherDocuments') {
        return {
          ...prev,
          otherDocuments: [
            ...prev.otherDocuments,
            ...files.map((file) => normalizeDocument({
              id: '',
              name: file.name,
              slotKey,
              originalName: file.name,
              size: file.size,
              file,
            }, false)),
          ],
        };
      }

      const [file] = files;

      return {
        ...prev,
        [slotKey]: file
          ? normalizeDocument({
              id: '',
              name: file.name,
              slotKey,
              originalName: file.name,
              size: file.size,
              file,
            }, false)
          : null,
      };
    });

    setFieldErrors((prev) => ({ ...prev, [slotKey]: '' }));
  };

  const handleRemoveDocument = (slotKey, index = null) => {
    setDocuments((prev) => {
      if (slotKey === 'otherDocuments') {
        return {
          ...prev,
          otherDocuments: prev.otherDocuments.filter((_, itemIndex) => itemIndex !== index),
        };
      }

      return {
        ...prev,
        [slotKey]: null,
      };
    });
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.faculty) errors.faculty = t('appForm.errors.faculty');
    if (!formData.speciality) errors.speciality = t('appForm.errors.speciality');

    const entScore = Number(formData.entExamScore);
    if (formData.entExamScore === '' || Number.isNaN(entScore) || entScore < 0 || entScore > 140) {
      errors.entExamScore = t('appForm.errors.entScore');
    }

    if (!formData.studyType) errors.studyType = t('appForm.errors.studyType');
    if (!formData.fundingType) errors.fundingType = t('appForm.errors.fundingType');
    if (!formData.birthDate) errors.birthDate = t('appForm.errors.birthDate');
    if (!formData.citizenship) errors.citizenship = t('appForm.errors.citizenship');
    if (!formData.gender) errors.gender = t('appForm.errors.gender');
    if (!formData.address.trim()) errors.address = t('appForm.errors.address');
    if (!formData.phone.trim()) {
      errors.phone = t('appForm.errors.phoneRequired');
    } else if (!/^[0-9+\-()\s]{7,30}$/.test(formData.phone.trim())) {
      errors.phone = t('register.errors.phone');
    }

    if (!formData.schoolName.trim()) errors.schoolName = t('appForm.errors.schoolName');
    if (!formData.graduationYear) errors.graduationYear = t('appForm.errors.graduationYear');

    const gpa = Number(formData.gpa);
    if (formData.gpa === '' || Number.isNaN(gpa) || gpa < 0 || gpa > 5) {
      errors.gpa = t('appForm.errors.gpa');
    }

    if (formData.hasIelts) {
      const ieltsScore = Number(formData.ieltsScore);
      if (formData.ieltsScore === '' || Number.isNaN(ieltsScore) || ieltsScore < 0 || ieltsScore > 9) {
        errors.ieltsScore = t('appForm.errors.ieltsScore');
      }
    }

    if (formData.hasToefl) {
      const toeflScore = Number(formData.toeflScore);
      if (formData.toeflScore === '' || Number.isNaN(toeflScore) || toeflScore < 0) {
        errors.toeflScore = t('appForm.errors.toeflScore');
      }
    }

    if (formData.hasOlympiad && !formData.olympiadLevel) {
      errors.olympiadLevel = t('appForm.errors.olympiadLevel');
    }

    documentSlotConfig.forEach((slot) => {
      if (slot.hidden || !slot.required) return;

      const value = documents[slot.key];
      const hasDocument = slot.key === 'otherDocuments'
        ? value.length > 0
        : Boolean(value);

      if (!hasDocument) {
        errors[slot.key] = t('appForm.errors.requiredDocument');
      }
    });

    return errors;
  };

  const buildFormDataPayload = () => {
    const payload = new FormData();

    Object.entries({
      faculty: formData.faculty,
      speciality: formData.speciality,
      entExamScore: formData.entExamScore,
      studyType: formData.studyType,
      fundingType: formData.fundingType,
      priority: formData.priority,
      birthDate: formData.birthDate,
      citizenship: formData.citizenship,
      gender: formData.gender,
      address: formData.address.trim(),
      phone: formData.phone.trim(),
      schoolName: formData.schoolName.trim(),
      graduationYear: formData.graduationYear,
      gpa: formData.gpa,
      hasIelts: String(formData.hasIelts),
      ieltsScore: formData.ieltsScore,
      hasToefl: String(formData.hasToefl),
      toeflScore: formData.toeflScore,
      hasOlympiad: String(formData.hasOlympiad),
      olympiadLevel: formData.olympiadLevel,
      hasSports: String(formData.hasSports),
      hasOtherCertificates: String(formData.hasOtherCertificates),
      existingDocuments: JSON.stringify([
        documents.identityDocument,
        documents.diplomaDocument,
        documents.photoDocument,
        documents.entCertificateDocument,
        documents.languageCertificateDocument,
        ...documents.otherDocuments,
      ]
        .filter((document) => document?.isExisting)
        .map((document) => ({ id: document.id }))),
    }).forEach(([key, value]) => {
      payload.append(key, value ?? '');
    });

    Object.entries(documents).forEach(([slotKey, value]) => {
      if (slotKey === 'otherDocuments') {
        value
          .filter((document) => !document.isExisting && document.file)
          .forEach((document) => {
            payload.append('otherDocuments', document.file);
          });
        return;
      }

      if (value && !value.isExisting && value.file) {
        payload.append(slotKey, value.file);
      }
    });

    return payload;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');

    const validationErrors = validateForm();
    setFieldErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setErrorMessage(t('appForm.errors.fixInlineErrors'));
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = buildFormDataPayload();
      const response = isEditMode
        ? await updateApplication(applicationId, payload)
        : await createApplication(payload);

      updateCurrentUser?.({ phone: formData.phone.trim() });

      navigate('/dashboard', {
        replace: true,
        state: {
          successMessage: response.message || (isEditMode ? t('appForm.successEdit') : t('appForm.successNew')),
        },
      });
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFieldError = (key) =>
    fieldErrors[key] ? <span className="form-error-text">{fieldErrors[key]}</span> : null;

  const renderDocumentSlot = (slot) => {
    if (slot.hidden) {
      return null;
    }

    const value = documents[slot.key];

    if (slot.key === 'otherDocuments') {
      return (
        <div className="full-doc-slot" key={slot.key}>
          <div className="form-label">
            {slot.label}
          </div>
          <div className="document-list-stack">
            {value.map((document, index) => (
              <div key={`${document.originalName}-${index}`} className="doc-selected-file">
                <span className="doc-file-icon">{document.originalName?.toLowerCase().endsWith('.pdf') ? '📄' : '🖼️'}</span>
                <div>
                  <div className="doc-file-name">{document.originalName}</div>
                  <div className="doc-file-size">{formatFileSize(document.size)}</div>
                </div>
                {document.isExisting && document.url ? (
                  <a
                    href={getPublicFileUrl(document.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="doc-item-link"
                  >
                    {t('common.open')}
                  </a>
                ) : null}
                <button
                  type="button"
                  className="doc-file-clear"
                  onClick={() => handleRemoveDocument(slot.key, index)}
                >
                  ✕
                </button>
              </div>
            ))}

            <div
              className="doc-dropzone compact"
              onClick={() => fileInputRefs.current[slot.key]?.click()}
            >
              <input
                ref={(element) => { fileInputRefs.current[slot.key] = element; }}
                type="file"
                accept={slot.accept}
                multiple={slot.multiple}
                onChange={(event) => handleFileSelect(slot.key, event.target.files)}
                style={{ display: 'none' }}
              />
              <p className="doc-dropzone-text">{t('appForm.documents.addOther')}</p>
              <p className="doc-dropzone-hint">{t('appForm.dropzoneHint')}</p>
            </div>
          </div>
          {renderFieldError(slot.key)}
        </div>
      );
    }

    return (
      <div className="full-doc-slot" key={slot.key}>
        <div className="form-label">
          {slot.label} {slot.required ? <span className="form-required">*</span> : null}
        </div>

        {value ? (
          <div className="doc-selected-file">
            <span className="doc-file-icon">{value.originalName?.toLowerCase().endsWith('.pdf') ? '📄' : '🖼️'}</span>
            <div>
              <div className="doc-file-name">{value.originalName}</div>
              <div className="doc-file-size">{formatFileSize(value.size)}</div>
            </div>
            {value.isExisting && value.url ? (
              <a
                href={getPublicFileUrl(value.url)}
                target="_blank"
                rel="noopener noreferrer"
                className="doc-item-link"
              >
                {t('common.open')}
              </a>
            ) : null}
            <button
              type="button"
              className="doc-file-clear"
              onClick={() => handleRemoveDocument(slot.key)}
            >
              ✕
            </button>
          </div>
        ) : (
          <div
            className="doc-dropzone compact"
            onClick={() => fileInputRefs.current[slot.key]?.click()}
          >
            <input
              ref={(element) => { fileInputRefs.current[slot.key] = element; }}
              type="file"
              accept={slot.accept}
              onChange={(event) => handleFileSelect(slot.key, event.target.files)}
              style={{ display: 'none' }}
            />
            <p className="doc-dropzone-text">{t('appForm.documents.upload')}</p>
            <p className="doc-dropzone-hint">{t('appForm.dropzoneHint')}</p>
          </div>
        )}

        {renderFieldError(slot.key)}
      </div>
    );
  };

  if (isLoadingData) {
    return (
      <>
        <Navbar />
        <LoadingSpinner fullPage text={t('appForm.loading')} />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="main-content">
        <div className="container">
          <div className="form-page-wrap">
            <div className="form-page-header">
              <div className="form-page-header-icon">{isEditMode ? '✏️' : '📝'}</div>
              <div>
                <h1 className="dash-hero-title" style={{ fontSize: 'clamp(1.25rem, 3vw, 1.625rem)' }}>
                  {isEditMode ? t('appForm.titleEdit') : t('appForm.titleNew')}
                </h1>
                <p className="dash-hero-sub">{t('appForm.subtitleSingleFlow')}</p>
              </div>
            </div>

            <div className="form-card">
              <ErrorMessage message={errorMessage} onDismiss={() => setErrorMessage('')} />

              <form onSubmit={handleSubmit} noValidate>
                <div className="form-section">
                  <div className="form-section-header">
                    <span className="form-section-badge">1</span>
                    <span className="form-section-title">{t('appForm.sectionBasic')}</span>
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label htmlFor="faculty" className="form-label">{t('appForm.faculty')} <span className="form-required">*</span></label>
                      <select id="faculty" name="faculty" value={formData.faculty} onChange={handleInputChange} className="form-select" disabled={isSubmitting}>
                        <option value="">{t('appForm.facultyPlaceholder')}</option>
                        {FACULTY_OPTIONS.map(({ value }) => (
                          <option key={value} value={value}>{getLocalizedValue(language, 'faculties', value)}</option>
                        ))}
                      </select>
                      {renderFieldError('faculty')}
                    </div>

                    <div className="form-group">
                      <label htmlFor="speciality" className="form-label">{t('appForm.speciality')} <span className="form-required">*</span></label>
                      <select id="speciality" name="speciality" value={formData.speciality} onChange={handleInputChange} className="form-select" disabled={isSubmitting || !formData.faculty}>
                        <option value="">{formData.faculty ? t('appForm.specialityPlaceholder') : t('appForm.specialityDisabled')}</option>
                        {availableSpecialities.map(({ value }) => (
                          <option key={value} value={value}>{getLocalizedValue(language, 'specialities', value)}</option>
                        ))}
                      </select>
                      {renderFieldError('speciality')}
                    </div>

                    <div className="form-group">
                      <label htmlFor="entExamScore" className="form-label">{t('appForm.entScore')} <span className="form-required">*</span></label>
                      <input id="entExamScore" name="entExamScore" type="number" min="0" max="140" value={formData.entExamScore} onChange={handleInputChange} className="form-input" disabled={isSubmitting} />
                      {renderFieldError('entExamScore')}
                    </div>

                    <div className="form-group">
                      <label htmlFor="studyType" className="form-label">{t('appForm.studyType')} <span className="form-required">*</span></label>
                      <select id="studyType" name="studyType" value={formData.studyType} onChange={handleInputChange} className="form-select" disabled={isSubmitting}>
                        <option value="">{t('appForm.studyTypePlaceholder')}</option>
                        {STUDY_TYPE_OPTIONS.map(({ value }) => (
                          <option key={value} value={value}>{getLocalizedValue(language, 'studyTypes', value)}</option>
                        ))}
                      </select>
                      {renderFieldError('studyType')}
                    </div>

                    <div className="form-group">
                      <label htmlFor="fundingType" className="form-label">{t('appForm.fundingType')} <span className="form-required">*</span></label>
                      <select id="fundingType" name="fundingType" value={formData.fundingType} onChange={handleInputChange} className="form-select" disabled={isSubmitting}>
                        <option value="">{t('appForm.fundingTypePlaceholder')}</option>
                        {FUNDING_TYPE_OPTIONS.map(({ value }) => (
                          <option key={value} value={value}>{getLocalizedValue(language, 'fundingTypes', value)}</option>
                        ))}
                      </select>
                      {renderFieldError('fundingType')}
                    </div>

                    <div className="form-group">
                      <label htmlFor="priority" className="form-label">{t('appForm.priority')} <span className="form-required">*</span></label>
                      <select id="priority" name="priority" value={formData.priority} onChange={handleInputChange} className="form-select" disabled={isSubmitting}>
                        {['1', '2', '3', '4', '5'].map((priorityValue) => (
                          <option key={priorityValue} value={priorityValue}>{t(`appForm.priorities.${priorityValue}`)}</option>
                        ))}
                      </select>
                      {renderFieldError('priority')}
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <div className="form-section-header">
                    <span className="form-section-badge">2</span>
                    <span className="form-section-title">{t('appForm.personalSection')}</span>
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label htmlFor="birthDate" className="form-label">{t('appForm.birthDate')} <span className="form-required">*</span></label>
                      <input id="birthDate" name="birthDate" type="date" value={formData.birthDate} onChange={handleInputChange} className="form-input" disabled={isSubmitting} />
                      {renderFieldError('birthDate')}
                    </div>

                    <div className="form-group">
                      <label htmlFor="citizenship" className="form-label">{t('appForm.citizenship')} <span className="form-required">*</span></label>
                      <select id="citizenship" name="citizenship" value={formData.citizenship} onChange={handleInputChange} className="form-select" disabled={isSubmitting}>
                        <option value="kazakhstan">{t('appForm.citizenshipOptions.kazakhstan')}</option>
                        <option value="other">{t('appForm.citizenshipOptions.other')}</option>
                      </select>
                      {renderFieldError('citizenship')}
                    </div>

                    <div className="form-group">
                      <label htmlFor="gender" className="form-label">{t('appForm.gender')} <span className="form-required">*</span></label>
                      <select id="gender" name="gender" value={formData.gender} onChange={handleInputChange} className="form-select" disabled={isSubmitting}>
                        <option value="">{t('appForm.genderPlaceholder')}</option>
                        <option value="male">{t('appForm.genderOptions.male')}</option>
                        <option value="female">{t('appForm.genderOptions.female')}</option>
                      </select>
                      {renderFieldError('gender')}
                    </div>

                    <div className="form-group">
                      <label htmlFor="phone" className="form-label">{t('register.phone')} <span className="form-required">*</span></label>
                      <input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleInputChange} className="form-input" disabled={isSubmitting} />
                      {renderFieldError('phone')}
                    </div>

                    <div className="form-group full-width">
                      <label htmlFor="address" className="form-label">{t('appForm.address')} <span className="form-required">*</span></label>
                      <input id="address" name="address" type="text" value={formData.address} onChange={handleInputChange} className="form-input" disabled={isSubmitting} />
                      {renderFieldError('address')}
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <div className="form-section-header">
                    <span className="form-section-badge">3</span>
                    <span className="form-section-title">{t('appForm.educationSection')}</span>
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group full-width">
                      <label htmlFor="schoolName" className="form-label">{t('appForm.schoolName')} <span className="form-required">*</span></label>
                      <input id="schoolName" name="schoolName" type="text" value={formData.schoolName} onChange={handleInputChange} className="form-input" disabled={isSubmitting} />
                      {renderFieldError('schoolName')}
                    </div>

                    <div className="form-group">
                      <label htmlFor="graduationYear" className="form-label">{t('appForm.graduationYear')} <span className="form-required">*</span></label>
                      <select id="graduationYear" name="graduationYear" value={formData.graduationYear} onChange={handleInputChange} className="form-select" disabled={isSubmitting}>
                        <option value="">{t('appForm.graduationYearPlaceholder')}</option>
                        {GRADUATION_YEARS.map((year) => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                      {renderFieldError('graduationYear')}
                    </div>

                    <div className="form-group">
                      <label htmlFor="gpa" className="form-label">{t('appForm.gpa')} <span className="form-required">*</span></label>
                      <input id="gpa" name="gpa" type="number" step="0.01" min="0" max="5" value={formData.gpa} onChange={handleInputChange} className="form-input" disabled={isSubmitting} />
                      {renderFieldError('gpa')}
                    </div>
                  </div>

                  <div className="checkbox-grid">
                    <label className="checkbox-card">
                      <input type="checkbox" name="hasIelts" checked={formData.hasIelts} onChange={handleCheckboxChange} />
                      <span>{t('appForm.certificates.ielts')}</span>
                    </label>
                    <label className="checkbox-card">
                      <input type="checkbox" name="hasToefl" checked={formData.hasToefl} onChange={handleCheckboxChange} />
                      <span>{t('appForm.certificates.toefl')}</span>
                    </label>
                    <label className="checkbox-card">
                      <input type="checkbox" name="hasOlympiad" checked={formData.hasOlympiad} onChange={handleCheckboxChange} />
                      <span>{t('appForm.certificates.olympiad')}</span>
                    </label>
                    <label className="checkbox-card">
                      <input type="checkbox" name="hasSports" checked={formData.hasSports} onChange={handleCheckboxChange} />
                      <span>{t('appForm.certificates.sports')}</span>
                    </label>
                    <label className="checkbox-card">
                      <input type="checkbox" name="hasOtherCertificates" checked={formData.hasOtherCertificates} onChange={handleCheckboxChange} />
                      <span>{t('appForm.certificates.other')}</span>
                    </label>
                  </div>

                  <div className="form-grid-2 conditional-grid">
                    {formData.hasIelts && (
                      <div className="form-group">
                        <label htmlFor="ieltsScore" className="form-label">{t('appForm.ieltsScore')} <span className="form-required">*</span></label>
                        <input id="ieltsScore" name="ieltsScore" type="number" step="0.5" min="0" max="9" value={formData.ieltsScore} onChange={handleInputChange} className="form-input" disabled={isSubmitting} />
                        {renderFieldError('ieltsScore')}
                      </div>
                    )}

                    {formData.hasToefl && (
                      <div className="form-group">
                        <label htmlFor="toeflScore" className="form-label">{t('appForm.toeflScore')} <span className="form-required">*</span></label>
                        <input id="toeflScore" name="toeflScore" type="number" min="0" value={formData.toeflScore} onChange={handleInputChange} className="form-input" disabled={isSubmitting} />
                        {renderFieldError('toeflScore')}
                      </div>
                    )}

                    {formData.hasOlympiad && (
                      <div className="form-group">
                        <label htmlFor="olympiadLevel" className="form-label">{t('appForm.olympiadLevel')} <span className="form-required">*</span></label>
                        <select id="olympiadLevel" name="olympiadLevel" value={formData.olympiadLevel} onChange={handleInputChange} className="form-select" disabled={isSubmitting}>
                          <option value="">{t('appForm.olympiadLevelPlaceholder')}</option>
                          <option value="international">{t('appForm.olympiadLevels.international')}</option>
                          <option value="national">{t('appForm.olympiadLevels.national')}</option>
                          <option value="regional">{t('appForm.olympiadLevels.regional')}</option>
                        </select>
                        {renderFieldError('olympiadLevel')}
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-section">
                  <div className="form-section-header">
                    <span className="form-section-badge">4</span>
                    <span className="form-section-title">{t('appForm.sectionDocs')}</span>
                  </div>

                  <div className="documents-form-grid">
                    {documentSlotConfig.map(renderDocumentSlot)}
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" disabled={isSubmitting} className="btn btn-primary btn-lg" style={{ flex: 1 }}>
                    {isSubmitting
                      ? <><span className="spinner-sm" /> {t('appForm.submitting')}</>
                      : t('appForm.submitFull')}
                  </button>
                  <button type="button" onClick={() => navigate('/dashboard')} disabled={isSubmitting} className="btn btn-secondary btn-lg">
                    {t('appForm.cancel')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default ApplicationForm;
