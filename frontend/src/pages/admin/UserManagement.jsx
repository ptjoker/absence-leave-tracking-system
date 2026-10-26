import { CheckCircle2, ChevronLeft, ChevronRight, Download, Eye, Filter, Pencil, Plus, Power, PowerOff, Trash2, X } from 'lucide-react';

function AccountField({ label, name, value, onChange, type = 'text', required = false, requiredIndicator = false, readOnly = false, autoComplete, pattern, minLength, maxLength, inputMode }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-semibold text-[#526171]">{label}{requiredIndicator && <em className="ml-1 not-italic text-[#d05b48]">*</em>}</span><input name={name} type={type} value={value} onChange={onChange} required={required} readOnly={readOnly} autoComplete={autoComplete} pattern={pattern} minLength={minLength} maxLength={maxLength} inputMode={inputMode} className={`focus-ring w-full rounded-md border border-[#d7dde3] px-3 py-2.5 text-sm text-[#344252] outline-none focus:border-[#003a6c] ${readOnly ? 'bg-[#f4f6f8] text-[#82909d]' : 'bg-white'}`} /></label>;
}

function AccountSelect({ label, name, value, onChange, options, placeholder, requiredIndicator = false }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-[#526171]">{label}{requiredIndicator && <em className="ml-1 not-italic text-[#d05b48]">*</em>}</span>
      <select name={name} value={value} onChange={onChange} required className="focus-ring w-full rounded-md border border-[#d7dde3] bg-white px-3 py-2.5 text-sm text-[#344252] outline-none focus:border-[#003a6c]">
        <option value="">{placeholder}</option>
        {options.map((option) => {
          const optionValue = typeof option === 'string' ? option : option.value;
          const optionLabel = typeof option === 'string' ? option : option.label;
          return <option key={optionValue} value={optionValue}>{optionLabel}</option>;
        })}
      </select>
    </label>
  );
}

export default function UserManagement({
  loading, error, accounts, filteredAccounts, visibleAccounts, search, setSearch, roleFilter, setRoleFilter,
  page, pageSize, pageCount, accountNotice, accountDialog, accountForm, accountError, accountBusy,
  createdAccountDetails, signupDepartments, signupStudyLevels,
  onOpenAccount, onDeleteAccount, onChangeAccountStatus, onSaveAccount, onFormChange, onCloseDialog, onRoleChange,
  onPageChange, onExport, onCloseCreated,
}) {
  return (
    <section id="user-management" className="rounded-xl border border-[#e6eaee] bg-white p-5 shadow-[0_2px_8px_rgba(30,48,66,.04)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><h2 className="text-xl font-bold text-[#202a34]">User management</h2><p className="mt-1 text-sm text-[#82909d]">Create, review, edit, and delete user accounts.</p></div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <button type="button" onClick={() => onOpenAccount('create')} className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-[#003a6c] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#003a6c]"><Plus size={15} />Add new user</button>
          <button type="button" onClick={onExport} disabled={!accounts.length} className="focus-ring inline-flex items-center justify-center gap-2 rounded-md border border-[#d7dde3] px-3 py-2 text-xs font-semibold text-[#526171] hover:bg-[#f6f8fa] disabled:opacity-50"><Download size={14} />Export report</button>
        </div>
      </div>
      {accountNotice && <p role="status" className="mt-4 rounded-md border border-[#bce4cf] bg-[#effaf4] px-3 py-2.5 text-sm font-semibold text-[#18794e]">{accountNotice}</p>}
      <div className="mt-5 flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
        <div className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-md bg-[#f1f3f5] p-1">{[['all', 'All users'], ['student', 'Student assistants'], ['supervisor', 'Supervisors']].map(([value, label]) => <button key={value} type="button" onClick={() => setRoleFilter(value)} className={`focus-ring shrink-0 rounded px-3 py-2 text-xs font-semibold transition-colors ${roleFilter === value ? 'bg-white text-[#202a34] shadow-sm' : 'text-[#687583] hover:text-[#202a34]'}`}>{label}</button>)}</div>
        <div className="flex gap-2">
          <label className="relative min-w-0 flex-1 sm:w-64" htmlFor="admin-account-search"><span className="sr-only">Search accounts</span><input id="admin-account-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email, or ID…" className="focus-ring w-full rounded-md border border-[#d7dde3] py-2.5 pl-3 pr-3 text-xs outline-none focus:border-[#003a6c]" /></label>
          <button type="button" onClick={() => { setSearch(''); setRoleFilter('all'); }} className="focus-ring inline-flex items-center gap-1.5 rounded-md border border-[#d7dde3] px-3 py-2 text-xs font-semibold text-[#526171] hover:bg-[#f6f8fa]"><Filter size={13} />Reset</button>
        </div>
      </div>
      {error && <div role="alert" className="mt-4 rounded-md border border-[#f1c6c3] bg-[#fff1f0] px-3 py-2.5 text-sm font-semibold text-[#b84233]">{error}</div>}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead><tr className="border-y border-[#e8ecef] bg-[#f7f8f9] text-[10px] font-bold uppercase tracking-[.08em] text-[#ff9c03]"><th className="px-3 py-3">User profile</th><th className="px-3 py-3">Administrative role</th><th className="px-3 py-3">Department / course</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Created</th><th className="px-3 py-3 text-right">Actions</th></tr></thead>
          <tbody>
            {visibleAccounts.map((account) => <tr key={`${account.apiRole}-${account.id}`} className="border-b border-[#edf0f2] last:border-0 hover:bg-[#fafbfc]">
              <td className="px-3 py-3 font-semibold text-[#344252]">{account.name || 'Unnamed account'}<span className="mt-0.5 block text-[11px] font-normal text-[#82909d]">{account.email || 'Email unavailable'}{account.studentNumber ? ` · ${account.studentNumber}` : ''}</span></td><td className="px-3 py-3"><span className="rounded bg-[#f0f4f8] px-2 py-1 text-[10px] font-bold text-[#526171]">{account.role}</span></td><td className="px-3 py-3 text-xs text-[#687583]">{account.course ? `${account.course}${account.levelOfStudy ? ` · Level ${account.levelOfStudy}` : ''}` : '—'}</td><td className="px-3 py-3"><span className={`rounded px-2 py-1 text-[10px] font-bold ${account.accountStatus === 'disabled' ? 'bg-[#fff1f0] text-[#b84233]' : 'bg-[#e8f8f0] text-[#18875f]'}`}>{account.accountStatus === 'disabled' ? 'Deactivated' : 'Active'}</span></td><td className="px-3 py-3 text-xs text-[#82909d]">{formatDate(account.createdAt)}</td>
              <td className="px-3 py-3"><div className="flex justify-end gap-1"><button type="button" onClick={() => onOpenAccount('view', account)} aria-label={`View ${account.name || 'user'}`} title="View details" className="focus-ring rounded p-2 text-[#526171] hover:bg-[#003a6c] hover:text-white"><Eye size={15} /></button><button type="button" onClick={() => onOpenAccount('edit', account)} aria-label={`Edit ${account.name || 'user'}`} title="Edit account" className="focus-ring rounded p-2 text-[#526171] hover:bg-[#003a6c] hover:text-white"><Pencil size={15} /></button><button type="button" onClick={() => onOpenAccount('status', account)} aria-label={`${account.accountStatus === 'disabled' ? 'Activate' : 'Deactivate'} ${account.name || 'user'}`} title={account.accountStatus === 'disabled' ? 'Activate account' : 'Deactivate account'} className={`focus-ring rounded p-2 ${account.accountStatus === 'disabled' ? 'text-[#18875f] hover:bg-[#e8f8f0]' : 'text-[#a56b0b] hover:bg-[#fff5e5]'}`}>{account.accountStatus === 'disabled' ? <Power size={15} /> : <PowerOff size={15} />}</button><button type="button" onClick={() => onOpenAccount('delete', account)} aria-label={`Delete ${account.name || 'user'}`} title="Delete account" className="focus-ring rounded p-2 text-[#cb3f43] hover:bg-[#fff1f0]"><Trash2 size={15} /></button></div></td>
            </tr>)}
            {!loading && !visibleAccounts.length && <tr><td colSpan={6} className="py-10 text-center text-sm text-[#82909d]">{error ? 'User list could not be loaded.' : search ? 'No matching accounts.' : 'No accounts to display.'}</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[#edf0f2] pt-3">
        <p className="text-xs text-[#82909d]">Showing {filteredAccounts.length ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, filteredAccounts.length)} of {filteredAccounts.length} accounts</p>
        <div className="flex items-center gap-2"><button type="button" disabled={page <= 1} onClick={() => onPageChange(Math.max(1, page - 1))} className="focus-ring inline-flex items-center gap-1 rounded-md border border-[#d7dde3] px-2.5 py-1.5 text-xs font-semibold text-[#526171] hover:bg-[#f6f8fa] disabled:cursor-not-allowed disabled:opacity-45"><ChevronLeft size={14} />Previous</button><span className="rounded-md bg-[#003a6c] px-3 py-1.5 text-xs font-bold text-white">{page} / {pageCount}</span><button type="button" disabled={page >= pageCount} onClick={() => onPageChange(Math.min(pageCount, page + 1))} className="focus-ring inline-flex items-center gap-1 rounded-md border border-[#d7dde3] px-2.5 py-1.5 text-xs font-semibold text-[#526171] hover:bg-[#f6f8fa] disabled:cursor-not-allowed disabled:opacity-45">Next<ChevronRight size={14} /></button></div>
      </div>
      {accountDialog && <AccountDialog {...{ accountDialog, accountForm, accountError, accountBusy, signupDepartments, signupStudyLevels, onFormChange, onCloseDialog, onRoleChange, onSaveAccount, onDeleteAccount, onChangeAccountStatus, onOpenAccount, formatDate }} />}
      {createdAccountDetails && <CreatedAccountDialog details={createdAccountDetails} studyLevels={signupStudyLevels} onClose={onCloseCreated} />}
    </section>
  );
}

function CreatedAccountDialog({ details, studyLevels, onClose }) {
  const rows = [
    ['Role', details.role],
    ['First name', details.first_name],
    ['Last name', details.last_name],
    ['Login email', details.student_email],
    ['Temporary password', details.password],
    ['Student number', details.student_number],
    ['Course', details.course],
    ['Level of study', studyLevels.find(({ value }) => value === details.level_of_study)?.label || details.level_of_study],
    ['Cell number', details.cell_number],
    ['Personal email', details.personal_email],
  ].filter(([, value]) => value);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-[#142333]/55 px-4 py-6">
      <section role="dialog" aria-modal="true" aria-labelledby="created-account-title" className="my-auto w-full max-w-lg rounded-xl bg-white p-5 shadow-[0_18px_45px_rgba(30,48,66,.25)] sm:p-7">
        <div className="flex items-start gap-3 border-b border-[#e8ecef] pb-4">
          <CheckCircle2 size={22} className="mt-0.5 shrink-0 text-[#19885d]" />
          <div>
            <h2 id="created-account-title" className="text-xl font-bold text-[#202a34]">User created successfully</h2>
            <p className="mt-1 text-xs text-[#82909d]">Account details to share with the new user:</p>
          </div>
        </div>
        <dl className="mt-4 grid gap-x-6 sm:grid-cols-2">
          {rows.map(([label, value]) => (
            <div key={label} className="border-b border-[#edf0f2] py-2.5">
              <dt className="text-[10px] font-bold uppercase tracking-wide text-[#82909d]">{label}</dt>
              <dd className="mt-1 break-all text-sm font-semibold text-[#344252]">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="admin-created-account-notice mt-4 rounded-md border border-[#e4d6ba] bg-[#fffaf0] px-3 py-2.5 text-xs font-semibold leading-5 text-[#7a5b25]">
          These details are ready to share with the user. They have not been emailed.
        </p>
        <div className="mt-5 flex justify-end">
          <button type="button" onClick={onClose} className="focus-ring rounded-md bg-[#003a6c] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#003a6c]">Done</button>
        </div>
      </section>
    </div>
  );
}

function formatDate(value) {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function AccountDialog({ accountDialog, accountForm, accountError, accountBusy, signupDepartments, signupStudyLevels, onFormChange, onCloseDialog, onRoleChange, onSaveAccount, onDeleteAccount, onChangeAccountStatus, onOpenAccount, formatDate: dateFormatter }) {
  const showRequiredIndicators = accountDialog.mode === 'create';
  const isStudentAccount = (accountDialog.mode === 'create' && accountDialog.role === 'student')
    || (accountDialog.mode === 'edit' && accountDialog.account.apiRole === 'student');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#142333]/45 px-4 py-6" onMouseDown={(event) => { if (event.target === event.currentTarget && !accountBusy) onCloseDialog(); }}>
      <section role={['delete', 'status'].includes(accountDialog.mode) ? 'alertdialog' : 'dialog'} aria-modal="true" aria-labelledby="admin-account-dialog-title" className="my-auto w-full max-w-2xl rounded-xl bg-white p-5 shadow-[0_18px_45px_rgba(30,48,66,.25)] sm:p-7">
        <div className="flex items-start justify-between gap-4 border-b border-[#e8ecef] pb-4"><div><p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#003a6c]">User management</p><h2 id="admin-account-dialog-title" className="mt-1 text-xl font-bold text-[#202a34]">{accountDialog.mode === 'create' ? 'Add new user' : accountDialog.mode === 'edit' ? 'Edit user account' : accountDialog.mode === 'delete' ? 'Delete user account' : accountDialog.mode === 'status' ? `${accountDialog.nextStatus === 'disabled' ? 'Deactivate' : 'Activate'} user account` : 'User profile'}</h2><p className="mt-1 text-xs text-[#82909d]">{accountDialog.mode === 'create' ? 'Create an account for a student assistant or supervisor.' : accountDialog.account?.name}</p></div><button type="button" onClick={onCloseDialog} disabled={accountBusy} aria-label="Close dialog" className="focus-ring rounded-md p-1.5 text-[#82909d] hover:bg-[#f1f3f5] disabled:opacity-50"><X size={18} /></button></div>
        {accountError && <p role="alert" className="mt-4 rounded-md border border-[#f1c6c3] bg-[#fff1f0] px-3 py-2.5 text-sm font-semibold text-[#b84233]">{accountError}</p>}
        {accountDialog.mode === 'view' && <dl className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2">{[['First name', accountDialog.account?.firstName], ['Last name', accountDialog.account?.lastName], ['Email address', accountDialog.account?.email], ['Role', accountDialog.account?.role], ['Student number', accountDialog.account?.studentNumber], ['Course', accountDialog.account?.course], ['Level of study', accountDialog.account?.levelOfStudy], ['Cell number', accountDialog.account?.cellNumber], ['Personal email', accountDialog.account?.personalEmail], ['Created', dateFormatter(accountDialog.account?.createdAt)]].filter(([, value]) => value).map(([label, value]) => <div key={label} className="border-b border-[#edf0f2] pb-2"><dt className="text-[10px] font-bold uppercase tracking-wide text-[#82909d]">{label}</dt><dd className="mt-1 break-words text-sm font-medium text-[#344252]">{value}</dd></div>)}<div className="flex justify-end gap-2 sm:col-span-2"><button type="button" onClick={() => onOpenAccount('edit', accountDialog.account)} className="focus-ring rounded-md bg-[#003a6c] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#003a6c]">Edit account</button></div></dl>}
        {accountDialog.mode === 'delete' && <div className="mt-5"><p className="text-sm leading-6 text-[#526171]">You are about to permanently remove <strong>{accountDialog.account?.name || 'this user'}</strong> ({accountDialog.account?.email || 'no email available'}). This action cannot be undone. The server may prevent deletion if this account has existing system records.</p><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={onCloseDialog} disabled={accountBusy} className="focus-ring rounded-md border border-[#d7dde3] px-4 py-2.5 text-xs font-bold text-[#526171] hover:bg-[#f6f8fa]">Cancel</button><button type="button" onClick={onDeleteAccount} disabled={accountBusy} className="focus-ring rounded-md bg-[#d84a44] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#b93b36] disabled:opacity-60">{accountBusy ? 'Deleting…' : 'Delete account'}</button></div></div>}
        {accountDialog.mode === 'status' && <div className="mt-5"><p className="text-sm leading-6 text-[#526171]">{accountDialog.nextStatus === 'disabled' ? 'Deactivating' : 'Activating'} <strong>{accountDialog.account?.name || 'this user'}</strong> ({accountDialog.account?.email || 'no email available'}) will {accountDialog.nextStatus === 'disabled' ? 'prevent them from using their account until it is activated again.' : 'restore their ability to use their account.'}</p><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={onCloseDialog} disabled={accountBusy} className="focus-ring rounded-md border border-[#d7dde3] px-4 py-2.5 text-xs font-bold text-[#526171] hover:bg-[#f6f8fa]">Cancel</button><button type="button" onClick={onChangeAccountStatus} disabled={accountBusy} className={`focus-ring rounded-md px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60 ${accountDialog.nextStatus === 'disabled' ? 'bg-[#c17a13] hover:bg-[#a5680d]' : 'bg-[#19885d] hover:bg-[#14724d]'}`}>{accountBusy ? 'Updating…' : accountDialog.nextStatus === 'disabled' ? 'Deactivate account' : 'Activate account'}</button></div></div>}
        {(accountDialog.mode === 'create' || accountDialog.mode === 'edit') && <form onSubmit={onSaveAccount} className="mt-5 space-y-4">
          {accountDialog.mode === 'create' && <label className="block max-w-xs"><span className="mb-1.5 block text-xs font-semibold text-[#526171]">Administrative role<em className="ml-1 not-italic text-[#d05b48]">*</em></span><select value={accountDialog.role} onChange={(event) => onRoleChange(event.target.value)} className="focus-ring w-full rounded-md border border-[#d7dde3] bg-white px-3 py-2.5 text-sm text-[#344252] outline-none focus:border-[#003a6c]"><option value="student">Student assistant</option><option value="supervisor">Supervisor</option></select></label>}
          <div className="grid gap-4 sm:grid-cols-2">
            <AccountField label="First name" name="first_name" value={accountForm.first_name} onChange={onFormChange} required requiredIndicator={showRequiredIndicators} />
            <AccountField label="Last name" name="last_name" value={accountForm.last_name} onChange={onFormChange} required requiredIndicator={showRequiredIndicators} />
            {accountDialog.mode === 'create' ? (
              <>
                <AccountField label={accountDialog.role === 'student' ? 'Student email' : 'Login email'} name="student_email" value={accountForm.student_email} onChange={onFormChange} type="email" required requiredIndicator={showRequiredIndicators} autoComplete="email" pattern={accountDialog.role === 'student' ? '[0-9]{9}@tut4life\\.ac\\.za' : undefined} />
                <AccountField label="Temporary password" name="password" value={accountForm.password} onChange={onFormChange} type="password" required requiredIndicator={showRequiredIndicators} autoComplete="new-password" />
              </>
            ) : <AccountField label="Login email (cannot be changed here)" name="student_email" value={accountForm.student_email} readOnly />}
            {isStudentAccount && (
              <>
                <AccountField label="Student number" name="student_number" value={accountForm.student_number} onChange={onFormChange} required requiredIndicator={showRequiredIndicators} pattern="[0-9]{9}" minLength={9} maxLength={9} inputMode="numeric" />
                {accountDialog.mode === 'create' ? (
                  <>
                    <AccountSelect label="Course or department" name="course" value={accountForm.course} onChange={onFormChange} options={signupDepartments} placeholder="Choose a course or department" requiredIndicator={showRequiredIndicators} />
                    <AccountSelect label="Level of study" name="level_of_study" value={accountForm.level_of_study} onChange={onFormChange} options={signupStudyLevels} placeholder="Choose a level of study" requiredIndicator={showRequiredIndicators} />
                  </>
                ) : (
                  <>
                    <AccountField label="Course" name="course" value={accountForm.course} onChange={onFormChange} required />
                    <AccountField label="Level of study" name="level_of_study" value={accountForm.level_of_study} onChange={onFormChange} required />
                  </>
                )}
              </>
            )}
            <AccountField label="Cell number (optional)" name="cell_number" value={accountForm.cell_number} onChange={onFormChange} type="tel" autoComplete="tel" />
            <AccountField label="Personal email (optional)" name="personal_email" value={accountForm.personal_email} onChange={onFormChange} type="email" autoComplete="email" />
          </div>
          <div className="flex justify-end gap-2 border-t border-[#edf0f2] pt-4"><button type="button" onClick={onCloseDialog} disabled={accountBusy} className="focus-ring rounded-md border border-[#d7dde3] px-4 py-2.5 text-xs font-bold text-[#526171] hover:bg-[#f6f8fa]">Cancel</button><button type="submit" disabled={accountBusy} className="focus-ring rounded-md bg-[#003a6c] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#003a6c] disabled:opacity-60">{accountBusy ? 'Saving…' : accountDialog.mode === 'create' ? 'Create user' : 'Save changes'}</button></div>
        </form>}
      </section>
    </div>
  );
}
