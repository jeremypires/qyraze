const ctaBtn = document.querySelector('.cta-button')
const ctaEmail = document.querySelector('.cta-email')
const ctaForm = document.querySelector('.cta-form')
const ctaSuccess = document.querySelector('.cta-success')

ctaBtn?.addEventListener('click', async () => {
  const email = ctaEmail?.value?.trim().toLowerCase()

  if (!email) {
    ctaEmail?.setCustomValidity('Email invalide')
    ctaEmail?.reportValidity()
    return
  }

  ctaBtn.textContent = 'Enregistrement...'
  let data = null;

  try {
    // await initSupabase();

    const response = await fetch('/api/waitlist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    data = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (response.status === 409) {
        ctaForm.style.display = 'none';
        ctaSuccess.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="flex-shrink:0">
            <circle cx="8" cy="8" r="7.5" stroke="#3dd68c" stroke-opacity=".6"/>
            <path d="M4.5 8l2.5 2.5L11.5 5.5" stroke="#3dd68c" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Cet email est déjà enregistré sur la liste.
        `;
        ctaSuccess.classList.add('visible');
        return;
      }

      throw new Error(data?.error || 'Erreur waitlist');
    }

    ctaForm.style.display = 'none'
    ctaSuccess.textContent = 'Tu es sur la liste ! Vérifie maintenant ta boîte mail.'
    ctaSuccess.classList.add('visible')
  } catch (error) {
    ctaEmail?.setCustomValidity(data?.error || "Impossible d'enregistrer l'email pour le moment.")
    ctaEmail?.reportValidity()
  } finally {
    ctaBtn.textContent = 'S’inscrire'
  }
})
