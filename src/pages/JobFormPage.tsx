import { type ChangeEvent, type FormEvent, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { ApiError } from '../api/ApiError';
import { ChoiceList } from '../components/ChoiceList';
import { FormBanner } from '../components/FormBanner';
import { FormField } from '../components/FormField';
import { ProtectedImage } from '../components/ProtectedImage';
import { SelectField } from '../components/SelectField';
import { SubmitButton } from '../components/SubmitButton';
import { TextField } from '../components/TextField';
import { useFormSubmission } from '../hooks/useFormSubmission';
import { type JobFormData, useJobFormData } from '../hooks/useJobFormData';
import { editJobPath, paths } from '../routes/paths';
import { jobService } from '../services';
import type { ContractType, WorkMode } from '../types/api';
import { contractTypeLabels, workModeLabels } from '../types/labels';
import {
  EMPTY_JOB_FORM,
  type JobForm,
  listFieldError,
  MAX_JOB_PHOTOS,
  photoError,
  toJobForm,
  toJobRequest,
  todayLocal,
  validateJob,
} from '../validation/jobs';
import './jobs.css';
import './recruiter.css';

// I070 — JobFormPage (modelo de classes do frontend web v02, secção 8.2; ecrãs W10 e W11 do protótipo v02).

const contractOptions = Object.entries(contractTypeLabels).map(([value, label]) => ({
  value,
  label,
}));
const workModeOptions = Object.entries(workModeLabels).map(([value, label]) => ({ value, label }));

/** Estado passado pela navegação depois de uma criação com fotografias recusadas. */
interface FormLocationState {
  photoErrors?: string[];
}

interface JobFormBodyProps {
  jobId: string | null;
  data: JobFormData;
  initialPhotoErrors: string[];
  onPhotosChanged: () => void;
}

/** Criação (W10) e alteração (W11) da vaga; a vaga é gravada como não publicada (RF050 a RF052, RF054). */
export default function JobFormPage() {
  const { jobId = null } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { data, error, reload } = useJobFormData(jobId);
  const title = jobId === null ? 'Criar vaga' : 'Editar vaga';

  if (error) {
    return (
      <section className="recruiter-page">
        <h1>{title}</h1>
        <div role="alert" className="alert">
          <p>{error.message}</p>
          <button type="button" onClick={reload}>
            Tentar de novo
          </button>
          <button type="button" onClick={() => navigate(paths.jobs)}>
            Voltar às vagas
          </button>
        </div>
      </section>
    );
  }
  // Ao passar da criação para a alteração, o componente mantém-se: espera-se pelos dados da vaga certa.
  if (data === null || (data.job?.jobId ?? null) !== jobId) {
    return (
      <section className="recruiter-page">
        <h1>{title}</h1>
        <p>A carregar…</p>
      </section>
    );
  }
  if (data.job?.status === 'CLOSED') {
    return (
      <section className="recruiter-page">
        <h1>{title}</h1>
        <p role="alert" className="alert">
          A vaga «{data.job.title}» está encerrada e não pode ser alterada.
        </p>
        <button type="button" onClick={() => navigate(paths.jobs)}>
          Voltar às vagas
        </button>
      </section>
    );
  }
  return (
    <JobFormBody
      key={jobId ?? 'nova'}
      jobId={jobId}
      data={data}
      initialPhotoErrors={(location.state as FormLocationState | null)?.photoErrors ?? []}
      onPhotosChanged={reload}
    />
  );
}

function JobFormBody({
  jobId,
  data,
  initialPhotoErrors,
  onPhotosChanged,
}: Readonly<JobFormBodyProps>) {
  const navigate = useNavigate();
  const form = useFormSubmission();
  const [values, setValues] = useState<JobForm>(() =>
    data.job === null
      ? { ...EMPTY_JOB_FORM, locationId: data.companyLocationId ?? '' }
      : toJobForm(data.job),
  );
  const [pendingPhotos, setPendingPhotos] = useState<File[]>([]);
  const [photoErrors, setPhotoErrors] = useState<string[]>(initialPhotoErrors);
  const savedPhotos = data.job?.photoUrls ?? [];
  const photoCount = savedPhotos.length + pendingPhotos.length;

  const set = (field: keyof JobForm) => (value: string) =>
    setValues((current) => ({ ...current, [field]: value }));

  const choosePhotos = (event: ChangeEvent<HTMLInputElement>) => {
    const chosen = Array.from(event.target.files ?? []);
    event.target.value = '';
    const accepted: File[] = [];
    const rejected: string[] = [];
    for (const file of chosen) {
      const reason = photoError(file);
      if (reason !== null) {
        rejected.push(reason);
      } else if (photoCount + accepted.length >= MAX_JOB_PHOTOS) {
        rejected.push(`${file.name}: a vaga pode ter no máximo ${MAX_JOB_PHOTOS} fotografias.`);
      } else {
        accepted.push(file);
      }
    }
    setPendingPhotos((current) => [...current, ...accepted]);
    setPhotoErrors(rejected);
  };

  /** As fotografias só são enviadas depois de a vaga existir (secção 5, regra 3). */
  const uploadPhotos = async (savedJobId: string): Promise<string[]> => {
    const failures: string[] = [];
    for (const file of pendingPhotos) {
      try {
        await jobService.addPhoto(savedJobId, file);
      } catch (caught) {
        failures.push(`${file.name}: ${ApiError.from(caught).message}`);
      }
    }
    return failures;
  };

  const save = async () => {
    const request = toJobRequest(values);
    const saved =
      jobId === null ? await jobService.create(request) : await jobService.update(jobId, request);
    const failures = await uploadPhotos(saved.jobId);
    if (failures.length === 0) {
      const notice =
        jobId === null
          ? `Vaga «${saved.title}» criada como não publicada.`
          : `Vaga «${saved.title}» alterada.`;
      await navigate(paths.jobs, { state: { notice } });
    } else if (jobId === null) {
      // A vaga já existe: continua-se na alteração, com as fotografias recusadas indicadas.
      await navigate(editJobPath(saved.jobId), {
        replace: true,
        state: { photoErrors: failures } satisfies FormLocationState,
      });
    } else {
      setPendingPhotos([]);
      setPhotoErrors(failures);
      onPhotosChanged();
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    void form.submit(event, validateJob(values), save);
  };

  const locationOptions = data.locations.map((item) => ({ value: item.id, label: item.name }));

  return (
    <section className="recruiter-page">
      <h1>{jobId === null ? 'Criar vaga' : 'Editar vaga'}</h1>
      <form className="job-form" onSubmit={handleSubmit} noValidate>
        <FormBanner banner={form.banner} busy={form.busy} />
        <div className="job-form-grid">
          <div className="job-form-column">
            <TextField
              id="title"
              label="Função"
              placeholder="Ex.: Empregado de mesa"
              value={values.title}
              onChange={set('title')}
              error={form.errors.title}
            />
            <FormField id="description" label="Descrição" error={form.errors.description}>
              {(control) => (
                <textarea
                  {...control}
                  rows={5}
                  placeholder="Descreva a vaga"
                  value={values.description}
                  onChange={(event) => set('description')(event.target.value)}
                />
              )}
            </FormField>
            <div className="field-pair">
              <TextField
                id="minSalary"
                label="Salário mínimo (€ brutos/mês)"
                inputMode="decimal"
                value={values.minSalary}
                onChange={set('minSalary')}
                error={form.errors.minSalary}
              />
              <TextField
                id="maxSalary"
                label="Salário máximo (€ brutos/mês)"
                inputMode="decimal"
                value={values.maxSalary}
                onChange={set('maxSalary')}
                error={form.errors.maxSalary}
              />
            </div>
            <p className="note">O valor mínimo não pode ser superior ao máximo.</p>
            <div className="field-pair">
              <SelectField
                id="locationId"
                label="Localidade"
                placeholder="Escolha uma localidade"
                options={locationOptions}
                value={values.locationId}
                onChange={set('locationId')}
                error={form.errors.locationId}
              />
              <SelectField
                id="contractType"
                label="Contrato"
                placeholder="Escolha o tipo de contrato"
                options={contractOptions}
                value={values.contractType}
                onChange={(value) =>
                  setValues((current) => ({ ...current, contractType: value as ContractType }))
                }
                error={form.errors.contractType}
              />
            </div>
            <SelectField
              id="workMode"
              label="Regime"
              placeholder="Escolha o regime de trabalho"
              options={workModeOptions}
              value={values.workMode}
              onChange={(value) =>
                setValues((current) => ({ ...current, workMode: value as WorkMode }))
              }
              error={form.errors.workMode}
            />
            <ChoiceList
              id="skillIds"
              legend="Competências (lista)"
              items={data.skills}
              selected={values.skillIds}
              onChange={(skillIds) => setValues((current) => ({ ...current, skillIds }))}
              error={listFieldError(form.errors, 'skillIds')}
            />
          </div>

          <div className="job-form-column">
            <ChoiceList
              id="benefitIds"
              legend="Benefícios opcionais (lista)"
              items={data.benefits}
              selected={values.benefitIds}
              onChange={(benefitIds) => setValues((current) => ({ ...current, benefitIds }))}
              error={listFieldError(form.errors, 'benefitIds')}
            />
            <label className="checkbox">
              <input
                type="checkbox"
                checked={values.isUrgent}
                onChange={(event) =>
                  setValues((current) => ({ ...current, isUrgent: event.target.checked }))
                }
              />
              Marcar como urgente
            </label>
            <FormField id="expiresAt" label="Data-limite (opcional)" error={form.errors.expiresAt}>
              {(control) => (
                <input
                  {...control}
                  type="date"
                  min={todayLocal()}
                  value={values.expiresAt}
                  onChange={(event) => set('expiresAt')(event.target.value)}
                />
              )}
            </FormField>

            <div className="photos-box">
              <h2>Fotografias</h2>
              <p className="note">
                Até {MAX_JOB_PHOTOS} fotografias · JPEG ou PNG até 5 MB cada ({photoCount}/
                {MAX_JOB_PHOTOS})
              </p>
              <ul className="photo-grid">
                {savedPhotos.map((url, index) => (
                  <li key={url}>
                    <ProtectedImage url={url} alt={`Fotografia ${index + 1} da vaga`} />
                  </li>
                ))}
                {pendingPhotos.map((file, index) => (
                  <li key={`${file.name}-${index}`} className="pending-photo">
                    <span>{file.name}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setPendingPhotos((current) => current.filter((_, i) => i !== index))
                      }
                    >
                      Retirar
                    </button>
                  </li>
                ))}
              </ul>
              {photoErrors.length > 0 && (
                <ul role="alert" className="form-error photo-errors">
                  {photoErrors.map((message) => (
                    <li key={message}>{message}</li>
                  ))}
                </ul>
              )}
              <label className="file-button">
                Adicionar fotografia
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  multiple
                  disabled={photoCount >= MAX_JOB_PHOTOS || form.busy}
                  onChange={choosePhotos}
                />
              </label>
            </div>
            <p className="info-box">
              {jobId === null
                ? 'A vaga é guardada como não publicada.'
                : 'As alterações são apresentadas aos Candidatos se a vaga estiver publicada.'}
            </p>
          </div>
        </div>
        <div className="form-actions">
          <SubmitButton busy={form.busy}>Guardar</SubmitButton>
          <button type="button" disabled={form.busy} onClick={() => navigate(paths.jobs)}>
            Cancelar
          </button>
        </div>
      </form>
    </section>
  );
}
