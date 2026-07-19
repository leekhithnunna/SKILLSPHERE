import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setUser } from '../redux/authSlice';
import userService from '../services/userService';
import resolveFileUrl from '../utils/resolveFileUrl';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const PROFICIENCY_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'];

const emptyExperience = { title: '', company: '', startDate: '', endDate: '', current: false, description: '' };
const emptyCertification = { name: '', issuer: '', year: '', credentialUrl: '' };
const emptyPortfolio = { title: '', description: '', projectUrl: '' };

const FreelancerProfilePage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const fp = user?.freelancerProfile || {};

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [skillName, setSkillName] = useState('');
  const [skillLevel, setSkillLevel] = useState('intermediate');
  const [hourlyRate, setHourlyRate] = useState(fp.hourlyRate ?? '');
  const [acceptsMilestone, setAcceptsMilestone] = useState(fp.acceptsMilestonePricing ?? true);
  const [availability, setAvailability] = useState(() => {
    const byDay = Object.fromEntries((fp.weeklyAvailability || []).map((a) => [a.day, a.hours]));
    return DAYS.map((day) => ({ day, hours: byDay[day] ?? 0 }));
  });

  const [experienceForm, setExperienceForm] = useState(emptyExperience);
  const [certForm, setCertForm] = useState(emptyCertification);
  const [portfolioForm, setPortfolioForm] = useState(emptyPortfolio);
  const [portfolioImage, setPortfolioImage] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);

  const persist = (partial) => userService.updateFreelancerProfile(partial);

  const applyUpdate = (data) => {
    dispatch(setUser(data.user));
    setMessage('Saved');
    setTimeout(() => setMessage(''), 2000);
  };

  // ── Skills ──────────────────────────────────────────────────────────────
  const addSkill = async () => {
    if (!skillName.trim()) return;
    const skillProficiencies = [
      ...(fp.skillProficiencies || []),
      { skill: skillName.trim(), level: skillLevel },
    ];
    setSaving(true);
    try {
      const { data } = await persist({ skillProficiencies });
      applyUpdate(data);
      setSkillName('');
    } finally {
      setSaving(false);
    }
  };

  const removeSkill = async (skill) => {
    const skillProficiencies = (fp.skillProficiencies || []).filter((s) => s.skill !== skill);
    setSaving(true);
    try {
      const { data } = await persist({ skillProficiencies });
      applyUpdate(data);
    } finally {
      setSaving(false);
    }
  };

  // ── Pricing ─────────────────────────────────────────────────────────────
  const savePricing = async () => {
    setSaving(true);
    try {
      const { data } = await persist({
        hourlyRate: hourlyRate === '' ? null : Number(hourlyRate),
        acceptsMilestonePricing: acceptsMilestone,
      });
      applyUpdate(data);
    } finally {
      setSaving(false);
    }
  };

  // ── Availability ────────────────────────────────────────────────────────
  const saveAvailability = async () => {
    setSaving(true);
    try {
      const { data } = await persist({ weeklyAvailability: availability });
      applyUpdate(data);
    } finally {
      setSaving(false);
    }
  };

  // ── Experience ──────────────────────────────────────────────────────────
  const addExperience = async () => {
    if (!experienceForm.title.trim()) return;
    const experience = [...(fp.experience || []), experienceForm];
    setSaving(true);
    try {
      const { data } = await persist({ experience });
      applyUpdate(data);
      setExperienceForm(emptyExperience);
    } finally {
      setSaving(false);
    }
  };

  const removeExperience = async (idx) => {
    const experience = (fp.experience || []).filter((_, i) => i !== idx);
    setSaving(true);
    try {
      const { data } = await persist({ experience });
      applyUpdate(data);
    } finally {
      setSaving(false);
    }
  };

  // ── Certifications ──────────────────────────────────────────────────────
  const addCertification = async () => {
    if (!certForm.name.trim()) return;
    const certifications = [...(fp.certifications || []), { ...certForm, year: certForm.year ? Number(certForm.year) : undefined }];
    setSaving(true);
    try {
      const { data } = await persist({ certifications });
      applyUpdate(data);
      setCertForm(emptyCertification);
    } finally {
      setSaving(false);
    }
  };

  const removeCertification = async (idx) => {
    const certifications = (fp.certifications || []).filter((_, i) => i !== idx);
    setSaving(true);
    try {
      const { data } = await persist({ certifications });
      applyUpdate(data);
    } finally {
      setSaving(false);
    }
  };

  // ── Portfolio ───────────────────────────────────────────────────────────
  const addPortfolioItem = async (e) => {
    e.preventDefault();
    if (!portfolioForm.title.trim()) return;
    const formData = new FormData();
    formData.append('title', portfolioForm.title);
    formData.append('description', portfolioForm.description);
    formData.append('projectUrl', portfolioForm.projectUrl);
    if (portfolioImage) formData.append('image', portfolioImage);

    setSaving(true);
    try {
      const { data } = await userService.addPortfolioItem(formData);
      applyUpdate(data);
      setPortfolioForm(emptyPortfolio);
      setPortfolioImage(null);
    } finally {
      setSaving(false);
    }
  };

  const removePortfolioItem = async (itemId) => {
    setSaving(true);
    try {
      const { data } = await userService.removePortfolioItem(itemId);
      applyUpdate(data);
    } finally {
      setSaving(false);
    }
  };

  // ── Resume ──────────────────────────────────────────────────────────────
  const uploadResume = async () => {
    if (!resumeFile) return;
    const formData = new FormData();
    formData.append('resume', resumeFile);
    setSaving(true);
    try {
      const { data } = await userService.uploadResume(formData);
      applyUpdate(data);
      setResumeFile(null);
    } finally {
      setSaving(false);
    }
  };

  if (user?.role !== 'freelancer') {
    return <p className="text-gray-500">This page is only available to freelancer accounts.</p>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Professional Profile</h1>
        <div className="flex items-center gap-2">
          {message && <span className="text-xs text-green-600">{message}</span>}
          {fp.isVerifiedBadge ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium">
              ✓ Verified Freelancer
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-gray-500 text-xs font-medium">
              Not yet verified
            </span>
          )}
        </div>
      </div>

      {/* Skills with proficiency */}
      <div className="card space-y-3">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Skills &amp; Proficiency</h2>
        <div className="flex flex-wrap gap-2">
          {(fp.skillProficiencies || []).map((s) => (
            <span key={s.skill} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-medium">
              {s.skill} <span className="text-primary-400">· {s.level}</span>
              <button onClick={() => removeSkill(s.skill)} className="text-primary-400 hover:text-primary-700 ml-0.5" aria-label={`Remove ${s.skill}`}>×</button>
            </span>
          ))}
          {(fp.skillProficiencies || []).length === 0 && <p className="text-gray-400 text-sm italic">No skills added yet.</p>}
        </div>
        <div className="flex gap-2">
          <input value={skillName} onChange={(e) => setSkillName(e.target.value)} placeholder="e.g. React" className="form-input flex-1" />
          <select value={skillLevel} onChange={(e) => setSkillLevel(e.target.value)} className="form-input w-40">
            {PROFICIENCY_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <button onClick={addSkill} disabled={saving || !skillName.trim()} className="btn-secondary px-4">Add</button>
        </div>
      </div>

      {/* Pricing */}
      <div className="card space-y-3">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Hourly &amp; Milestone Pricing</h2>
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="form-label">Hourly Rate (USD)</label>
            <input type="number" min="0" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} className="form-input" placeholder="e.g. 35" />
          </div>
          <label className="flex items-center gap-2 pb-2.5 text-sm text-gray-700">
            <input type="checkbox" checked={acceptsMilestone} onChange={(e) => setAcceptsMilestone(e.target.checked)} className="w-4 h-4" />
            Accepts milestone-based pricing
          </label>
          <button onClick={savePricing} disabled={saving} className="btn-secondary shrink-0">Save</button>
        </div>
      </div>

      {/* Availability calendar */}
      <div className="card space-y-3">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Weekly Availability</h2>
        <div className="grid grid-cols-7 gap-2">
          {availability.map((a, idx) => (
            <div key={a.day} className="text-center">
              <p className="text-xs text-gray-500 mb-1">{a.day}</p>
              <input
                type="number"
                min="0"
                max="24"
                value={a.hours}
                onChange={(e) => {
                  const hours = Number(e.target.value);
                  setAvailability((prev) => prev.map((d, i) => (i === idx ? { ...d, hours } : d)));
                }}
                className="form-input text-center px-1"
              />
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400">Hours available per day. Used for the booking scheduler.</p>
        <button onClick={saveAvailability} disabled={saving} className="btn-secondary">Save Availability</button>
      </div>

      {/* Experience timeline */}
      <div className="card space-y-3">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Work Experience</h2>
        <div className="space-y-3">
          {(fp.experience || []).map((exp, idx) => (
            <div key={idx} className="flex items-start justify-between gap-3 pb-3 border-b border-gray-100 last:border-0">
              <div>
                <p className="text-sm font-semibold text-gray-900">{exp.title} {exp.company && `· ${exp.company}`}</p>
                <p className="text-xs text-gray-400">
                  {exp.startDate ? new Date(exp.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''}
                  {' — '}
                  {exp.current ? 'Present' : exp.endDate ? new Date(exp.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''}
                </p>
                {exp.description && <p className="text-sm text-gray-600 mt-1">{exp.description}</p>}
              </div>
              <button onClick={() => removeExperience(idx)} className="text-red-400 hover:text-red-600 text-xs shrink-0">Remove</button>
            </div>
          ))}
          {(fp.experience || []).length === 0 && <p className="text-gray-400 text-sm italic">No experience added yet.</p>}
        </div>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <input placeholder="Job title" value={experienceForm.title} onChange={(e) => setExperienceForm((p) => ({ ...p, title: e.target.value }))} className="form-input" />
          <input placeholder="Company" value={experienceForm.company} onChange={(e) => setExperienceForm((p) => ({ ...p, company: e.target.value }))} className="form-input" />
          <input type="date" value={experienceForm.startDate} onChange={(e) => setExperienceForm((p) => ({ ...p, startDate: e.target.value }))} className="form-input" />
          <input type="date" value={experienceForm.endDate} onChange={(e) => setExperienceForm((p) => ({ ...p, endDate: e.target.value }))} className="form-input" disabled={experienceForm.current} />
          <label className="flex items-center gap-2 text-sm text-gray-700 col-span-2">
            <input type="checkbox" checked={experienceForm.current} onChange={(e) => setExperienceForm((p) => ({ ...p, current: e.target.checked, endDate: '' }))} className="w-4 h-4" />
            I currently work here
          </label>
          <textarea placeholder="Description" value={experienceForm.description} onChange={(e) => setExperienceForm((p) => ({ ...p, description: e.target.value }))} className="form-input col-span-2" rows={2} />
        </div>
        <button onClick={addExperience} disabled={saving || !experienceForm.title.trim()} className="btn-secondary">Add Experience</button>
      </div>

      {/* Certifications */}
      <div className="card space-y-3">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Certifications</h2>
        <div className="space-y-2">
          {(fp.certifications || []).map((c, idx) => (
            <div key={idx} className="flex items-center justify-between gap-3 text-sm">
              <span>{c.name} {c.issuer && `· ${c.issuer}`} {c.year && `(${c.year})`}</span>
              <button onClick={() => removeCertification(idx)} className="text-red-400 hover:text-red-600 text-xs shrink-0">Remove</button>
            </div>
          ))}
          {(fp.certifications || []).length === 0 && <p className="text-gray-400 text-sm italic">No certifications added yet.</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input placeholder="Certification name" value={certForm.name} onChange={(e) => setCertForm((p) => ({ ...p, name: e.target.value }))} className="form-input" />
          <input placeholder="Issuer" value={certForm.issuer} onChange={(e) => setCertForm((p) => ({ ...p, issuer: e.target.value }))} className="form-input" />
          <input type="number" placeholder="Year" value={certForm.year} onChange={(e) => setCertForm((p) => ({ ...p, year: e.target.value }))} className="form-input" />
          <input placeholder="Credential URL" value={certForm.credentialUrl} onChange={(e) => setCertForm((p) => ({ ...p, credentialUrl: e.target.value }))} className="form-input" />
        </div>
        <button onClick={addCertification} disabled={saving || !certForm.name.trim()} className="btn-secondary">Add Certification</button>
      </div>

      {/* Portfolio gallery */}
      <div className="card space-y-3">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Portfolio Gallery</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {(fp.portfolio || []).map((item) => (
            <div key={item._id} className="relative group border border-gray-100 rounded-lg overflow-hidden">
              {item.imageUrl ? (
                <img src={resolveFileUrl(item.imageUrl)} alt={item.title} className="w-full h-24 object-cover" />
              ) : (
                <div className="w-full h-24 bg-gray-50 flex items-center justify-center text-gray-300 text-xs">No image</div>
              )}
              <div className="p-2">
                <p className="text-xs font-medium text-gray-900 truncate">{item.title}</p>
                {item.projectUrl && (
                  <a href={item.projectUrl} target="_blank" rel="noreferrer" className="text-[11px] text-primary-600 hover:underline">View project</a>
                )}
              </div>
              <button
                onClick={() => removePortfolioItem(item._id)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white/90 text-red-500 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <form onSubmit={addPortfolioItem} className="grid grid-cols-2 gap-3 pt-2">
          <input placeholder="Project title" value={portfolioForm.title} onChange={(e) => setPortfolioForm((p) => ({ ...p, title: e.target.value }))} className="form-input" />
          <input placeholder="Project URL" value={portfolioForm.projectUrl} onChange={(e) => setPortfolioForm((p) => ({ ...p, projectUrl: e.target.value }))} className="form-input" />
          <textarea placeholder="Description" value={portfolioForm.description} onChange={(e) => setPortfolioForm((p) => ({ ...p, description: e.target.value }))} className="form-input col-span-2" rows={2} />
          <input type="file" accept="image/*" onChange={(e) => setPortfolioImage(e.target.files?.[0] || null)} className="col-span-2 text-sm" />
          <button type="submit" disabled={saving || !portfolioForm.title.trim()} className="btn-secondary col-span-2">Add to Portfolio</button>
        </form>
      </div>

      {/* Resume */}
      <div className="card space-y-3">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Resume</h2>
        {fp.resume?.url ? (
          <a href={resolveFileUrl(fp.resume.url)} target="_blank" rel="noreferrer" className="text-sm text-primary-600 hover:underline">
            {fp.resume.name || 'View current resume'}
          </a>
        ) : (
          <p className="text-gray-400 text-sm italic">No resume uploaded yet.</p>
        )}
        <div className="flex gap-2">
          <input type="file" accept=".pdf,.doc,.docx,image/*" onChange={(e) => setResumeFile(e.target.files?.[0] || null)} className="text-sm flex-1" />
          <button onClick={uploadResume} disabled={saving || !resumeFile} className="btn-secondary shrink-0">Upload</button>
        </div>
      </div>
    </div>
  );
};

export default FreelancerProfilePage;
