import { Component, output, signal } from '@angular/core';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  template: `
    <!-- Backdrop -->
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4"
         style="background:rgba(10,18,36,.75);backdrop-filter:blur(8px)">

      <!-- Card — fixed height so each step can scroll independently -->
      <div class="relative w-full max-w-lg bg-white rounded-[28px] shadow-[0_32px_80px_rgba(0,0,0,.3)]"
           style="height:90svh;display:flex;flex-direction:column;overflow:hidden">

        <!-- Skip -->
        <button (click)="finish()"
                class="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border"
                [class]="step() === 0
                  ? 'bg-white/15 border-white/20 text-white hover:bg-white/25'
                  : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'">
          Passer
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>

        <!-- Slider viewport -->
        <div style="flex:1;min-height:0;overflow:hidden">
          <!-- Track: 3 panels × 33.33% each, slides via translateX -->
          <div style="display:flex;width:300%;height:100%;transition:transform .38s cubic-bezier(.4,0,.2,1)"
               [style.transform]="'translateX(-' + step() * 33.3333 + '%)'">

            <!-- ══════════════════════════════════════════════════
                 STEP 1 — Welcome
            ══════════════════════════════════════════════════ -->
            <div style="width:33.3333%;flex-shrink:0;overflow-y:auto;display:flex;flex-direction:column">

              <!-- Dark header -->
              <div class="relative px-7 pt-12 pb-8 shrink-0 overflow-hidden"
                   style="background:linear-gradient(145deg,#0F2240 0%,#1B4F8A 100%)">
                <div class="absolute top-[-40px] right-[-40px] w-[180px] h-[180px] rounded-full pointer-events-none"
                     style="background:radial-gradient(circle,rgba(201,146,13,.2) 0%,transparent 70%)"></div>
                <div class="absolute bottom-[-30px] left-[-20px] w-[120px] h-[120px] rounded-full pointer-events-none"
                     style="background:radial-gradient(circle,rgba(27,79,138,.4) 0%,transparent 70%)"></div>
                <div class="relative flex items-center gap-3 mb-6">
                  <img src="/icons/icon-512-transparent.png" alt="Katica" class="w-10 h-10 object-contain" />
                  <span class="text-white text-2xl font-extrabold tracking-[-0.03em]">Katica</span>
                </div>
                <h2 class="text-white text-[1.625rem] font-extrabold tracking-[-0.03em] leading-[1.2] m-0 mb-2">
                  Bienvenue sur Katica&nbsp;👋
                </h2>
                <p class="m-0 text-sm font-medium leading-relaxed" style="color:rgba(203,213,225,.8)">
                  La plateforme de paiements sécurisés entre acheteurs et vendeurs au Cameroun.
                </p>
              </div>

              <!-- Feature cards -->
              <div class="px-6 py-6 flex flex-col gap-3">
                <div class="flex items-start gap-4 p-4 rounded-2xl border border-slate-100" style="background:#F8FAFC;box-shadow:0 2px 12px rgba(27,79,138,.05)">
                  <div class="w-10 h-10 shrink-0 rounded-[12px] flex items-center justify-center" style="background:rgba(27,79,138,.1)">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1B4F8A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  </div>
                  <div>
                    <p class="text-[.875rem] font-bold text-slate-900 m-0 mb-0.5">Escrow sécurisé</p>
                    <p class="text-xs text-slate-500 m-0 leading-relaxed">Vos fonds sont bloqués jusqu'à confirmation de livraison.</p>
                  </div>
                </div>
                <div class="flex items-start gap-4 p-4 rounded-2xl border border-slate-100" style="background:#F8FAFC;box-shadow:0 2px 12px rgba(201,146,13,.05)">
                  <div class="w-10 h-10 shrink-0 rounded-[12px] flex items-center justify-center" style="background:rgba(201,146,13,.12)">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C9920D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                  </div>
                  <div>
                    <p class="text-[.875rem] font-bold text-slate-900 m-0 mb-0.5">Wallet intégré</p>
                    <p class="text-xs text-slate-500 m-0 leading-relaxed">Gérez, suivez et retirez votre argent via Mobile Money.</p>
                  </div>
                </div>
                <div class="flex items-start gap-4 p-4 rounded-2xl border border-slate-100" style="background:#F8FAFC;box-shadow:0 2px 12px rgba(16,185,129,.05)">
                  <div class="w-10 h-10 shrink-0 rounded-[12px] flex items-center justify-center" style="background:rgba(16,185,129,.1)">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>
                  </div>
                  <div>
                    <p class="text-[.875rem] font-bold text-slate-900 m-0 mb-0.5">Litiges arbitrés</p>
                    <p class="text-xs text-slate-500 m-0 leading-relaxed">En cas de problème, une décision en 48h par notre équipe.</p>
                  </div>
                </div>
              </div>

            </div><!-- /step 1 -->

            <!-- ══════════════════════════════════════════════════
                 STEP 2 — How it works
            ══════════════════════════════════════════════════ -->
            <div style="width:33.3333%;flex-shrink:0;overflow-y:auto;display:flex;flex-direction:column">

              <div class="px-7 pt-8 pb-5 shrink-0 border-b border-slate-100">
                <div class="w-8 h-8 rounded-xl flex items-center justify-center mb-3" style="background:rgba(27,79,138,.1)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1B4F8A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                <h2 class="text-[1.375rem] font-extrabold text-slate-900 tracking-[-0.02em] m-0 mb-1">Comment ça marche&nbsp;?</h2>
                <p class="text-sm text-slate-500 m-0">Un flux simple et sécurisé de bout en bout.</p>
              </div>

              <div class="px-7 py-6 flex flex-col">
                @for (item of timeline; track item.n) {
                  <div class="flex gap-4">
                    <div class="flex flex-col items-center">
                      <div class="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-base z-10"
                           [style.background]="item.bg">{{ item.emoji }}</div>
                      @if (!$last) {
                        <div class="w-px my-1" style="flex:1;min-height:20px;background:linear-gradient(to bottom,#CBD5E1,transparent)"></div>
                      }
                    </div>
                    <div class="pb-5 pt-1 min-w-0">
                      <p class="text-[.875rem] font-bold text-slate-900 m-0 mb-0.5">{{ item.title }}</p>
                      <p class="text-xs text-slate-500 m-0 leading-relaxed">{{ item.desc }}</p>
                    </div>
                  </div>
                }
              </div>

              <div class="mx-6 mb-6 px-4 py-3 rounded-xl flex items-center gap-3 shrink-0"
                   style="background:rgba(201,146,13,.08);border:1px solid rgba(201,146,13,.2)">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#C9920D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <p class="text-xs font-semibold m-0" style="color:#96650A">Frais de plateforme&nbsp;: <strong>3&nbsp;%</strong> prélevés à la libération des fonds</p>
              </div>

            </div><!-- /step 2 -->

            <!-- ══════════════════════════════════════════════════
                 STEP 3 — CGU & Privacy (full content, must scroll)
            ══════════════════════════════════════════════════ -->
            <div style="width:33.3333%;flex-shrink:0;overflow-y:auto;display:flex;flex-direction:column">

              <!-- Header -->
              <div class="px-7 pt-8 pb-5 shrink-0 border-b border-slate-100">
                <div class="w-8 h-8 rounded-xl flex items-center justify-center mb-3" style="background:rgba(27,79,138,.1)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1B4F8A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <h2 class="text-[1.375rem] font-extrabold text-slate-900 tracking-[-0.02em] m-0 mb-1">Avant de commencer</h2>
                <p class="text-sm text-slate-500 m-0">Lisez attentivement nos conditions avant d'accepter.</p>
              </div>

              <div class="px-6 py-5 flex flex-col gap-5">

                <!-- ── CGU full content ──────────────────────── -->
                <div class="rounded-2xl border border-slate-200 overflow-hidden">
                  <div class="px-4 py-3 flex items-center gap-2 border-b border-slate-200" style="background:#EEF4FF">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1B4F8A" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    <span class="text-xs font-bold text-primary uppercase tracking-wider">Conditions Générales d'Utilisation</span>
                    <span class="ml-auto text-[10px] text-slate-400 font-medium">Version 1.0 — Mars 2026</span>
                  </div>
                  <div class="px-4 py-4 flex flex-col gap-4">

                    <div>
                      <p class="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-2">Éditeur</p>
                      <p class="text-xs text-slate-600 leading-relaxed m-0">BytesMind Tech, société de droit camerounais, Yaoundé. Contact légal&nbsp;: <span class="font-semibold text-slate-700">legal&#64;bytesmind.tech</span></p>
                    </div>

                    <div>
                      <p class="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-2">Art. 3 — Accès et inscription</p>
                      <ul class="m-0 p-0 flex flex-col gap-1.5 list-none">
                        <li class="flex gap-2 text-xs text-slate-600 leading-relaxed"><span class="text-primary mt-px shrink-0">›</span> Accès réservé aux personnes physiques âgées d'au moins <strong>18 ans</strong>, disposant d'un numéro de téléphone mobile valide.</li>
                        <li class="flex gap-2 text-xs text-slate-600 leading-relaxed"><span class="text-primary mt-px shrink-0">›</span> Inscription requiert&nbsp;: nom, prénom, numéro de téléphone, email valide et mot de passe sécurisé.</li>
                        <li class="flex gap-2 text-xs text-slate-600 leading-relaxed"><span class="text-primary mt-px shrink-0">›</span> Vérification d'identité (KYC) possible à tout moment pour conformité réglementaire. L'absence de vérification peut entraîner la limitation du compte.</li>
                        <li class="flex gap-2 text-xs text-slate-600 leading-relaxed"><span class="text-primary mt-px shrink-0">›</span> L'utilisateur est seul responsable de la confidentialité de ses identifiants. Il doit activer le MFA et signaler toute utilisation non autorisée.</li>
                      </ul>
                    </div>

                    <div>
                      <p class="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-2">Art. 4 — Services</p>
                      <ul class="m-0 p-0 flex flex-col gap-1.5 list-none">
                        <li class="flex gap-2 text-xs text-slate-600 leading-relaxed"><span class="text-primary mt-px shrink-0">›</span> <strong>Escrow&nbsp;:</strong> Le vendeur crée la transaction (min 25 XAF, max 10 000 000 XAF). L'acheteur paie via Mobile Money (CamPay/MonetBil). Les fonds sont séquestrés jusqu'à validation de la livraison.</li>
                        <li class="flex gap-2 text-xs text-slate-600 leading-relaxed"><span class="text-primary mt-px shrink-0">›</span> <strong>Wallet&nbsp;:</strong> Chaque utilisateur dispose d'un portefeuille affichant solde disponible, solde gelé et solde total. L'historique complet est consultable.</li>
                        <li class="flex gap-2 text-xs text-slate-600 leading-relaxed"><span class="text-primary mt-px shrink-0">›</span> <strong>Retrait (Payout)&nbsp;:</strong> Retrait vers un compte Mobile Money via saisie du montant, numéro bénéficiaire et validation par OTP.</li>
                        <li class="flex gap-2 text-xs text-slate-600 leading-relaxed"><span class="text-primary mt-px shrink-0">›</span> <strong>Litiges&nbsp;:</strong> En cas de désaccord, l'une ou l'autre des parties peut ouvrir un litige. Un agent Katica arbitre et rend une décision finale et exécutoire. Katica ne garantit pas l'issue en faveur d'une partie spécifique.</li>
                      </ul>
                    </div>

                    <div>
                      <p class="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-2">Art. 5 — Frais et tarification</p>
                      <ul class="m-0 p-0 flex flex-col gap-1.5 list-none">
                        <li class="flex gap-2 text-xs text-slate-600 leading-relaxed"><span class="text-primary mt-px shrink-0">›</span> Frais escrow&nbsp;: <strong>3 % du montant brut</strong>, arrondi à l'entier inférieur en XAF, prélevé à la libération des fonds. Exemple&nbsp;: 10 000 XAF → frais 300 XAF → vendeur reçoit 9 700 XAF.</li>
                        <li class="flex gap-2 text-xs text-slate-600 leading-relaxed"><span class="text-primary mt-px shrink-0">›</span> Des frais de retrait peuvent s'appliquer selon le prestataire, communiqués avant validation.</li>
                        <li class="flex gap-2 text-xs text-slate-600 leading-relaxed"><span class="text-primary mt-px shrink-0">›</span> Toute modification tarifaire est notifiée avec un préavis d'au moins <strong>30 jours</strong>.</li>
                      </ul>
                    </div>

                    <div>
                      <p class="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-2">Art. 6 & 7 — Obligations et activités interdites</p>
                      <ul class="m-0 p-0 flex flex-col gap-1.5 list-none">
                        <li class="flex gap-2 text-xs text-slate-600 leading-relaxed"><span class="text-primary mt-px shrink-0">›</span> Utilisation exclusivement à des fins légales. Interdiction de fraude, blanchiment de fonds ou financement d'activités illicites.</li>
                        <li class="flex gap-2 text-xs text-slate-600 leading-relaxed"><span class="text-primary mt-px shrink-0">›</span> Interdiction de créer plusieurs comptes pour contourner des restrictions ou d'utiliser des robots non autorisés.</li>
                        <li class="flex gap-2 text-xs text-slate-600 leading-relaxed"><span class="text-primary mt-px shrink-0">›</span> Sont strictement interdits&nbsp;: transactions liées à des activités illicites, escroqueries, usurpation d'identité, tentatives d'intrusion. Sanctions&nbsp;: suspension, blocage des fonds, poursuites judiciaires.</li>
                      </ul>
                    </div>

                    <div>
                      <p class="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-2">Art. 8 — Responsabilité de l'éditeur</p>
                      <ul class="m-0 p-0 flex flex-col gap-1.5 list-none">
                        <li class="flex gap-2 text-xs text-slate-600 leading-relaxed"><span class="text-primary mt-px shrink-0">›</span> La plateforme est fournie « en l'état ». Katica n'est pas responsable des pertes issues des transactions entre utilisateurs ni des retards des prestataires de paiement.</li>
                        <li class="flex gap-2 text-xs text-slate-600 leading-relaxed"><span class="text-primary mt-px shrink-0">›</span> CamPay et MonetBil opèrent sous leurs propres conditions. L'éditeur décline toute responsabilité pour leurs défaillances.</li>
                      </ul>
                    </div>

                    <div>
                      <p class="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-2">Art. 12 — Résiliation</p>
                      <ul class="m-0 p-0 flex flex-col gap-1.5 list-none">
                        <li class="flex gap-2 text-xs text-slate-600 leading-relaxed"><span class="text-primary mt-px shrink-0">›</span> Clôture possible par l'utilisateur à tout moment si aucune transaction en cours et solde nul ou retiré (support&#64;bytesmind.tech).</li>
                        <li class="flex gap-2 text-xs text-slate-600 leading-relaxed"><span class="text-primary mt-px shrink-0">›</span> L'éditeur peut suspendre un compte en cas de violation des CGU, activité suspecte, demande judiciaire, ou inactivité de plus de 24 mois.</li>
                      </ul>
                    </div>

                    <div>
                      <p class="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-2">Art. 14 — Droit applicable</p>
                      <p class="text-xs text-slate-600 leading-relaxed m-0">CGU régies par le <strong>droit camerounais</strong>. Tribunaux compétents&nbsp;: Yaoundé. Les utilisateurs UE bénéficient des protections impératives de leur droit national. Résolution amiable sous 30 jours avant tout recours judiciaire.</p>
                    </div>

                  </div>
                </div>

                <!-- ── Privacy Policy full content ───────────── -->
                <div class="rounded-2xl border border-slate-200 overflow-hidden">
                  <div class="px-4 py-3 flex items-center gap-2 border-b border-slate-200" style="background:#ECFDF5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                    <span class="text-xs font-bold uppercase tracking-wider" style="color:#059669">Politique de Confidentialité</span>
                    <span class="ml-auto text-[10px] text-slate-400 font-medium">Version 1.0 — Mars 2026</span>
                  </div>
                  <div class="px-4 py-4 flex flex-col gap-4">

                    <div>
                      <p class="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-2">Art. 2 — Données collectées</p>
                      <ul class="m-0 p-0 flex flex-col gap-1.5 list-none">
                        <li class="flex gap-2 text-xs text-slate-600 leading-relaxed"><span class="mt-px shrink-0" style="color:#10B981">›</span> <strong>Données directes&nbsp;:</strong> nom, prénom, numéro de téléphone, email, mot de passe (hashé), codes OTP, documents KYC si requis, montants et descriptions des transactions, preuves de litige, numéros Mobile Money pour les retraits.</li>
                        <li class="flex gap-2 text-xs text-slate-600 leading-relaxed"><span class="mt-px shrink-0" style="color:#10B981">›</span> <strong>Données automatiques&nbsp;:</strong> adresse IP, type d'appareil, OS, pages visitées, temps de session, logs d'actions, localisation approximative (IP uniquement).</li>
                        <li class="flex gap-2 text-xs text-slate-600 leading-relaxed"><span class="mt-px shrink-0" style="color:#10B981">›</span> <strong>Non collectées&nbsp;:</strong> données biométriques, de santé, opinions politiques ou religieuses, contenu de conversations privées.</li>
                      </ul>
                    </div>

                    <div>
                      <p class="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-2">Art. 3 — Finalités du traitement</p>
                      <ul class="m-0 p-0 flex flex-col gap-1.5 list-none">
                        <li class="flex gap-2 text-xs text-slate-600 leading-relaxed"><span class="mt-px shrink-0" style="color:#10B981">›</span> Exécution des services (compte, transactions escrow, wallet, retraits, arbitrage des litiges).</li>
                        <li class="flex gap-2 text-xs text-slate-600 leading-relaxed"><span class="mt-px shrink-0" style="color:#10B981">›</span> Sécurité et prévention de la fraude (OTP, MFA, détection d'anomalies).</li>
                        <li class="flex gap-2 text-xs text-slate-600 leading-relaxed"><span class="mt-px shrink-0" style="color:#10B981">›</span> Conformité légale KYC/AML (COBAC/ANIF Cameroun, TRACFIN France, FinCEN USA).</li>
                        <li class="flex gap-2 text-xs text-slate-600 leading-relaxed"><span class="mt-px shrink-0" style="color:#10B981">›</span> Amélioration de la plateforme et support client.</li>
                        <li class="flex gap-2 text-xs text-slate-600 leading-relaxed"><span class="mt-px shrink-0" style="color:#10B981">›</span> Communications transactionnelles. Marketing uniquement avec votre consentement.</li>
                      </ul>
                    </div>

                    <div>
                      <p class="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-2">Art. 4 — Partage des données</p>
                      <ul class="m-0 p-0 flex flex-col gap-1.5 list-none">
                        <li class="flex gap-2 text-xs text-slate-600 leading-relaxed"><span class="mt-px shrink-0" style="color:#10B981">›</span> <strong>Jamais vendues</strong> à des tiers.</li>
                        <li class="flex gap-2 text-xs text-slate-600 leading-relaxed"><span class="mt-px shrink-0" style="color:#10B981">›</span> Partagées avec CamPay / MonetBil (numéro de téléphone, montant) pour le traitement des paiements uniquement.</li>
                        <li class="flex gap-2 text-xs text-slate-600 leading-relaxed"><span class="mt-px shrink-0" style="color:#10B981">›</span> Divulgables aux autorités compétentes sur réquisition judiciaire ou déclaration de soupçon à l'ANIF.</li>
                        <li class="flex gap-2 text-xs text-slate-600 leading-relaxed"><span class="mt-px shrink-0" style="color:#10B981">›</span> En cas de cession/fusion de BytesMind Tech, vous serez informé au préalable avec possibilité de supprimer votre compte.</li>
                      </ul>
                    </div>

                    <div>
                      <p class="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-2">Art. 6 — Durées de conservation</p>
                      <div class="rounded-xl overflow-hidden border border-slate-100">
                        @for (row of retention; track row.type) {
                          <div class="flex items-center px-3 py-2 border-b border-slate-100 last:border-0"
                               [style.background]="$even ? '#F8FAFC' : 'white'">
                            <span class="text-xs text-slate-600 flex-1">{{ row.type }}</span>
                            <span class="text-xs font-semibold text-slate-800 ml-2 shrink-0">{{ row.duration }}</span>
                          </div>
                        }
                      </div>
                    </div>

                    <div>
                      <p class="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-2">Art. 7 — Vos droits</p>
                      <ul class="m-0 p-0 flex flex-col gap-1.5 list-none">
                        <li class="flex gap-2 text-xs text-slate-600 leading-relaxed"><span class="mt-px shrink-0" style="color:#10B981">›</span> <strong>Tous utilisateurs&nbsp;:</strong> accès, rectification, opposition, retrait du consentement.</li>
                        <li class="flex gap-2 text-xs text-slate-600 leading-relaxed"><span class="mt-px shrink-0" style="color:#10B981">›</span> <strong>UE (RGPD)&nbsp;:</strong> effacement (droit à l'oubli), portabilité, limitation du traitement, droit contre décision automatisée.</li>
                        <li class="flex gap-2 text-xs text-slate-600 leading-relaxed"><span class="mt-px shrink-0" style="color:#10B981">›</span> <strong>Californie (CCPA/CPRA)&nbsp;:</strong> droit de savoir, suppression, correction, refus du partage.</li>
                        <li class="flex gap-2 text-xs text-slate-600 leading-relaxed"><span class="mt-px shrink-0" style="color:#10B981">›</span> <strong>Canada (LPRPDE / Loi 25)&nbsp;:</strong> accès, correction, portabilité (Québec), retrait du consentement.</li>
                        <li class="flex gap-2 text-xs text-slate-600 leading-relaxed"><span class="mt-px shrink-0" style="color:#10B981">›</span> Pour exercer vos droits&nbsp;: <span class="font-semibold text-slate-700">privacy&#64;bytesmind.tech</span> — réponse sous 30 jours.</li>
                      </ul>
                    </div>

                    <div>
                      <p class="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-2">Art. 8 — Sécurité</p>
                      <ul class="m-0 p-0 flex flex-col gap-1.5 list-none">
                        <li class="flex gap-2 text-xs text-slate-600 leading-relaxed"><span class="mt-px shrink-0" style="color:#10B981">›</span> Chiffrement TLS/HTTPS en transit et au repos. MFA disponible sur tous les comptes.</li>
                        <li class="flex gap-2 text-xs text-slate-600 leading-relaxed"><span class="mt-px shrink-0" style="color:#10B981">›</span> Accès aux données limité aux seuls employés en ayant besoin. Tous les accès sont journalisés et audités.</li>
                        <li class="flex gap-2 text-xs text-slate-600 leading-relaxed"><span class="mt-px shrink-0" style="color:#10B981">›</span> Audits de sécurité et tests de pénétration réguliers. Procédure formelle de réponse aux violations de données.</li>
                      </ul>
                    </div>

                  </div>
                </div>

                <!-- Checkbox -->
                <label (click)="accepted.set(!accepted())"
                       class="flex items-start gap-3 cursor-pointer p-4 rounded-2xl transition-all border"
                       [class]="accepted()
                         ? 'border-primary/30 bg-primary/5'
                         : 'border-slate-200 bg-slate-50 hover:border-slate-300'">
                  <div class="shrink-0 mt-px w-5 h-5 rounded-[6px] border-2 flex items-center justify-center transition-all"
                       [class]="accepted() ? 'bg-primary border-primary' : 'bg-white border-slate-300'">
                    @if (accepted()) {
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    }
                  </div>
                  <p class="text-xs text-slate-600 m-0 leading-relaxed">
                    J'ai lu et j'accepte les <strong class="text-slate-800">Conditions Générales d'Utilisation</strong> et la <strong class="text-slate-800">Politique de Confidentialité</strong> de Katica — BytesMind Tech (Version 1.0, Mars 2026).
                  </p>
                </label>

                <!-- Bottom spacer -->
                <div class="h-2"></div>

              </div>
            </div><!-- /step 3 -->

          </div><!-- /track -->
        </div><!-- /viewport -->

        <!-- ── Footer ──────────────────────────────────────── -->
        <div class="px-6 py-4 border-t border-slate-100 flex items-center gap-3 shrink-0"
             style="background:#FAFBFC">

          @if (step() > 0) {
            <button (click)="prev()"
                    class="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50 hover:border-slate-300">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              Retour
            </button>
          }

          <div class="flex items-center gap-2 flex-1 justify-center">
            @for (i of [0,1,2]; track i) {
              <button (click)="goTo(i)"
                      class="rounded-full transition-all"
                      [class]="step() === i ? 'w-6 h-2 bg-primary' : 'w-2 h-2 bg-slate-300 hover:bg-slate-400'">
              </button>
            }
          </div>

          @if (step() < 2) {
            <button (click)="next()"
                    class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                    style="background:linear-gradient(135deg,#1B4F8A,#0D3D6E);box-shadow:0 4px 16px rgba(27,79,138,.3)">
              Suivant
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          } @else {
            <button (click)="finish()"
                    [disabled]="!accepted()"
                    class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
                    style="background:linear-gradient(135deg,#C9920D,#96650A);box-shadow:0 4px 16px rgba(201,146,13,.3)">
              Commencer
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </button>
          }

        </div>
      </div>
    </div>
  `,
})
export class OnboardingComponent {
  readonly done = output<void>();

  protected readonly step     = signal(0);
  protected readonly accepted = signal(false);

  protected readonly timeline = [
    { n: 1, emoji: '🛒', title: 'Vendeur crée la transaction',         desc: 'Il renseigne le montant, l\'acheteur et une description.',            bg: 'rgba(27,79,138,.1)'   },
    { n: 2, emoji: '💳', title: 'Acheteur paie via Mobile Money',      desc: 'Paiement sécurisé via CamPay ou MonetBil.',                            bg: 'rgba(201,146,13,.12)' },
    { n: 3, emoji: '🔒', title: 'Fonds séquestrés sur Katica',         desc: 'L\'argent est bloqué jusqu\'à confirmation de livraison.',             bg: 'rgba(139,92,246,.1)'  },
    { n: 4, emoji: '✅', title: 'Livraison confirmée → fonds libérés', desc: 'Le vendeur reçoit le montant sur son wallet (frais 3 % déduits).',     bg: 'rgba(16,185,129,.1)'  },
  ];

  protected readonly retention = [
    { type: 'Données de compte (identité, contact)', duration: '5 ans après clôture' },
    { type: 'Données de transactions',               duration: '10 ans (légal)'       },
    { type: 'Données KYC',                           duration: '5 ans post-relation'  },
    { type: 'Logs de sécurité',                      duration: '1 an'                 },
    { type: 'Données de litige',                     duration: '5 ans post-résolution'},
    { type: 'Codes OTP',                             duration: 'Supprimés immédiatement' },
  ];

  protected next()              { if (this.step() < 2) this.step.update(s => s + 1); }
  protected prev()              { if (this.step() > 0) this.step.update(s => s - 1); }
  protected goTo(i: number)     { this.step.set(i); }

  protected finish() {
    localStorage.setItem('katica_onboarded', '1');
    this.done.emit();
  }
}
