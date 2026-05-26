// ========================================================
// 1. STATE CONFIGURATION & SYNCED DATA STACKS
// ========================================================
let translationHistory = JSON.parse(localStorage.getItem("a1_history")) || [];
let appSettings = JSON.parse(localStorage.getItem("a1_settings")) || {
    engine: "gtx", 
    speechRate: 0.9
};
let userProfile = JSON.parse(localStorage.getItem("a1_user")) || {
    name: "Guest",
    tier: "Guest Access"
};

let apiConsoleKeys = JSON.parse(localStorage.getItem("a1_api_keys")) || {
    geminiKey: "",
    googleKey: "",
    azureKey: "",
    azureRegion: "eastus"
};

let isSignUpMode = false;

// DOM Interactors
const sourceInput = document.querySelector("#source-input");
const targetOutput = document.querySelector("#target-output");
const sourceLangSelect = document.querySelector("#source-lang");
const targetLangSelect = document.querySelector("#target-lang");
const translateActionBtn = document.querySelector("#trigger-translation-btn");
const swapLanguagesBtn = document.querySelector("#swap-languages-btn");
const charCountSpan = document.querySelector(".char-counter");

// Application Panels Elements
const navItems = document.querySelectorAll(".nav-item");
const appViews = document.querySelectorAll(".app-view");
const sidebarHistoryContainer = document.querySelector("#sidebar-history");

const settingsEngineSelect = document.querySelector("#engine-select");
const profileEngineSelect = document.querySelector("#profile-engine-select");
const activeModelText = document.querySelector(".active-model-text");

// Profile Console Form Inputs Sync targets
const profileGeminiInput = document.querySelector("#profile-gemini-key");
const profileGoogleInput = document.querySelector("#profile-google-key");
const profileAzureInput = document.querySelector("#profile-azure-key");
const profileRegionInput = document.querySelector("#profile-azure-region");

// UI CONTROLS TARGET ANCHORS
const editProfileToggleBtn = document.querySelector("#edit-profile-toggle-btn");
const editableProfileBlock = document.querySelector("#editable-profile-block");
const editUserNameInput = document.querySelector("#edit-user-name");
const editUserTierSelect = document.querySelector("#edit-user-tier");
const saveProfileEditBtn = document.querySelector("#save-profile-edit");
const cancelProfileEditBtn = document.querySelector("#cancel-profile-edit");

const authPortalTriggerBtn = document.querySelector("#auth-portal-trigger-btn");
const authModalBackdrop = document.querySelector("#auth-modal-backdrop");
const closeAuthModalBtn = document.querySelector("#close-auth-modal");
const authInteractiveForm = document.querySelector("#auth-interactive-form");
const authModalTitle = document.querySelector("#auth-modal-title");
const authPrimarySubmitBtn = document.querySelector("#auth-primary-submit-btn");
const authSwitchPromptText = document.querySelector("#auth-switch-prompt-text");
const authToggleModeAction = document.querySelector("#auth-toggle-mode-action");
const authLoginIdentifier = document.querySelector("#auth-login-identifier");
const authLoginPassword = document.querySelector("#auth-login-password");
// ========================================================
// 2. INTERACTIVE PROFILE & AUTH MANAGEMENT CORE
// ========================================================

function updateProfileUI() {
    if(document.querySelector(".dynamic-username")) {
        document.querySelectorAll(".dynamic-username").forEach(el => el.innerText = userProfile.name);
    }
    if(document.querySelector(".dynamic-avatar")) {
        document.querySelectorAll(".dynamic-avatar").forEach(el => el.innerText = userProfile.name.charAt(0).toUpperCase());
    }
    if(document.querySelector(".dynamic-tier")) {
        document.querySelectorAll(".dynamic-tier").forEach(el => el.innerText = `Tier: ${userProfile.tier}`);
    }
}

function initProfileFormFields() {
    if(profileGeminiInput) profileGeminiInput.value = apiConsoleKeys.geminiKey || "";
    if(profileGoogleInput) profileGoogleInput.value = apiConsoleKeys.googleKey || "";
    if(profileAzureInput) profileAzureInput.value = apiConsoleKeys.azureKey || "";
    if(profileRegionInput) profileRegionInput.value = apiConsoleKeys.azureRegion || "eastus";
}

// BULLETPROOF VIEW SWITCHER & SIDEBAR NAVIGATION LOGIC
document.addEventListener("click", (e) => {
    // Find if the clicked element or any of its parents is a nav target
    const clickableNavItem = e.target.closest("[data-target]");
    
    if (clickableNavItem) {
        const destination = clickableNavItem.getAttribute("data-target");
        
        // Remove active states across sidebar links safely
        document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("active"));
        
        // Add active state to current item if it has the class
        if (clickableNavItem.classList.contains("nav-item")) {
            clickableNavItem.classList.add("active");
        }

        // Switch panel visibility matrices
        document.querySelectorAll(".app-view").forEach(view => {
            if (view.id === destination) {
                view.classList.add("active");
            } else {
                view.classList.remove("active");
            }
        });

        // Specific actions per view mount
        if (destination === "profile-view") {
            const statsCounter = document.querySelector("#stats-total-count");
            if(statsCounter) statsCounter.innerText = translationHistory.length;
        }
    }
});

// Hook up the New Translation button to instantly clear input fields and jump home
const newTranslationBtn = document.querySelector(".new-chat-btn");
if (newTranslationBtn) {
    newTranslationBtn.addEventListener("click", () => {
        if (sourceInput) {
            sourceInput.value = "";
            sourceInput.dispatchEvent(new Event('input'));
        }
        if (targetOutput) targetOutput.value = "";
        
        // Force navigate back to Studio View viewscreen
        const studioPane = document.querySelector("#translator-view");
        if (studioPane) {
            document.querySelectorAll(".app-view").forEach(v => v.classList.remove("active"));
            studioPane.classList.add("active");
        }
    });
}

// Inline Interactive Profile Editor Toggle Control
if(editProfileToggleBtn) {
    editProfileToggleBtn.addEventListener("click", () => {
        if(editUserNameInput) editUserNameInput.value = userProfile.name;
        if(editUserTierSelect) editUserTierSelect.value = userProfile.tier;
        if(editableProfileBlock) editableProfileBlock.classList.remove("hidden-element");
    });
}

if(cancelProfileEditBtn) {
    cancelProfileEditBtn.addEventListener("click", () => {
        if(editableProfileBlock) editableProfileBlock.classList.add("hidden-element");
    });
}

if(saveProfileEditBtn) {
    saveProfileEditBtn.addEventListener("click", () => {
        const freshName = editUserNameInput ? editUserNameInput.value.trim() : "";
        if(freshName !== "") {
            userProfile.name = freshName;
            if(editUserTierSelect) userProfile.tier = editUserTierSelect.value;
            
            localStorage.setItem("a1_user", JSON.stringify(userProfile));
            updateProfileUI();
            if(editableProfileBlock) editableProfileBlock.classList.add("hidden-element");
        } else {
            alert("Username display parameters cannot be blank!");
        }
    });
}

// Authentication System Logic Routing
if(authPortalTriggerBtn) {
    authPortalTriggerBtn.addEventListener("click", () => {
        if(authModalBackdrop) authModalBackdrop.classList.remove("hidden-element");
    });
}

if(closeAuthModalBtn) {
    closeAuthModalBtn.addEventListener("click", () => {
        if(authModalBackdrop) authModalBackdrop.classList.add("hidden-element");
    });
}

if(authToggleModeAction) {
    authToggleModeAction.addEventListener("click", () => {
        isSignUpMode = !isSignUpMode;
        if(isSignUpMode) {
            if(authModalTitle) authModalTitle.innerText = "Create New Account";
            if(authPrimarySubmitBtn) authPrimarySubmitBtn.innerText = "Sign Up / Register";
            if(authSwitchPromptText) authSwitchPromptText.innerText = "Already have an account?";
            if(authToggleModeAction) authToggleModeAction.innerText = "Sign In";
        } else {
            if(authModalTitle) authModalTitle.innerText = "Sign In to Your Workspace";
            if(authPrimarySubmitBtn) authPrimarySubmitBtn.innerText = "Sign In";
            if(authSwitchPromptText) authSwitchPromptText.innerText = "Don't have an account yet?";
            if(authToggleModeAction) authToggleModeAction.innerText = "Create Account";
        }
    });
}

if(authInteractiveForm) {
    authInteractiveForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const handleValue = authLoginIdentifier ? authLoginIdentifier.value.trim() : "";
        const passwordValue = authLoginPassword ? authLoginPassword.value : "";

        if(!handleValue || !passwordValue) return;

        userProfile.name = handleValue.includes("@") ? handleValue.split("@")[0] : handleValue;
        userProfile.tier = "A1 Cloud Developer"; 
        
        localStorage.setItem("a1_user", JSON.stringify(userProfile));
        updateProfileUI();
        
        if(authLoginIdentifier) authLoginIdentifier.value = "";
        if(authLoginPassword) authLoginPassword.value = "";
        if(authModalBackdrop) authModalBackdrop.classList.add("hidden-element");
        
        alert(isSignUpMode ? "Registration Successful! Profile active." : "Logged In Successfully!");
    });
}

// ========================================================
// 3. TRANSLATION PIPELINE
// ========================================================
if(translateActionBtn) {
    translateActionBtn.addEventListener("click", async () => {
        const rawText = sourceInput ? sourceInput.value.trim() : "";
        if (!rawText) return;

        const currentEngine = appSettings.engine;
        
        if (currentEngine === "gemini" && !apiConsoleKeys.geminiKey) {
            if(targetOutput) targetOutput.value = "No API key for answering. Either enter your Gemini API key or use the default method.";
            return;
        }
        if (currentEngine === "google" && !apiConsoleKeys.googleKey) {
            if(targetOutput) targetOutput.value = "No API key for answering. Either enter your Google API key or use the default method.";
            return;
        }
        if (currentEngine === "microsoft" && !apiConsoleKeys.azureKey) {
            if(targetOutput) targetOutput.value = "No API key for answering. Either enter your Azure API key or use the default method.";
            return;
        }

        const btnText = translateActionBtn.querySelector("span");
        const loadingSpinner = translateActionBtn.querySelector(".loader");
        
        if(targetOutput) {
            targetOutput.value = "";
            targetOutput.placeholder = "A1 Core Engine processing context matrix...";
        }
        if(loadingSpinner) loadingSpinner.classList.remove("hidden");
        if(btnText) btnText.classList.add("hidden");
        translateActionBtn.disabled = true;

        try {
            let response, data, outputText = "";
            const fromLang = sourceLangSelect.options[sourceLangSelect.selectedIndex].text;
            const toLang = targetLangSelect.options[targetLangSelect.selectedIndex].text;
            const fromShort = sourceLangSelect.value.split('-')[0];
            const toShort = targetLangSelect.value.split('-')[0];

            switch (currentEngine) {
                case "gtx":
                    const freeUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${fromShort}&tl=${toShort}&dt=t&q=${encodeURIComponent(rawText)}`;
                    response = await fetch(freeUrl);
                    data = await response.json();
                    outputText = data[0].map(item => item[0]).join("");
                    break;
                    
                case "gemini":
                    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiConsoleKeys.geminiKey}`;
                    response = await fetch(geminiUrl, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            contents: [{
                                parts: [{ text: `Translate this text from ${fromLang} to ${toLang}. Provide ONLY the final translation response text. No extra text, no conversation, no markdown framing:\n\n${rawText}` }]
                            }]
                        })
                    });
                    data = await response.json();
                    if (data.error) throw new Error(data.error.message);
                    outputText = data.candidates[0].content.parts[0].text.trim();
                    break;
                    
                case "google":
                    response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${apiConsoleKeys.googleKey}`, {
                        method: "POST", 
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ q: rawText, source: fromShort, target: toShort, format: "text" })
                    });
                    data = await response.json();
                    if(data.error) throw new Error(data.error.message);
                    outputText = data.data.translations[0].translatedText;
                    break;
                    
                case "microsoft":
                    response = await fetch(`https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&from=${fromShort}&to=${toShort}`, {
                        method: "POST", 
                        headers: { 
                            "Ocp-Apim-Subscription-Key": apiConsoleKeys.azureKey, 
                            "Ocp-Apim-Subscription-Region": apiConsoleKeys.azureRegion, 
                            "Content-Type": "application/json" 
                        },
                        body: JSON.stringify([{ "Text": rawText }])
                    });
                    data = await response.json();
                    if(data.error) throw new Error(data.error.message);
                    outputText = data[0].translations[0].text;
                    break;
            }

            if(targetOutput) targetOutput.value = outputText;
            pushHistoryStack(rawText, outputText);

        } catch (e) {
            if(targetOutput) targetOutput.value = `API Engine Execution Failure: ${e.message}`;
            console.error("Pipeline Halt Logs:", e);
        } finally {
            if(loadingSpinner) loadingSpinner.classList.add("hidden");
            if(btnText) btnText.classList.remove("hidden");
            translateActionBtn.disabled = false;
            if(targetOutput) targetOutput.placeholder = "Translation will display here...";
        }
    });
}

// ========================================================
// 4. IMAGE INPUT (OCR) & VOICE CAPTURES
// ========================================================
const imageUpload = document.getElementById('image-upload');
if(imageUpload) {
    imageUpload.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (typeof Tesseract === 'undefined') {
            alert("OCR System language nodes loading. Wait a second.");
            return;
        }
        if(sourceInput) {
            sourceInput.value = "";
            sourceInput.placeholder = "📷 Analysing text arrays via OCR...";
        }
        try {
            const result = await Tesseract.recognize(file, 'eng');
            if(sourceInput) {
                sourceInput.value = result.data.text.trim();
                sourceInput.placeholder = "Enter text, use voice, or upload an image...";
                sourceInput.dispatchEvent(new Event('input'));
            }
        } catch (err) {
            console.error(err);
            if(sourceInput) sourceInput.placeholder = "OCR parsing errors encountered.";
        }
        e.target.value = ''; 
    });
}

const voiceInputBtn = document.querySelector("#voice-input-btn");
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition && voiceInputBtn) {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    voiceInputBtn.addEventListener("click", () => {
        if(sourceLangSelect) recognition.lang = sourceLangSelect.value;
        if (voiceInputBtn.classList.contains("recording")) {
            recognition.stop();
        } else {
            if(sourceInput) sourceInput.placeholder = "Listening to acoustics...";
            voiceInputBtn.classList.add("recording");
            recognition.start();
        }
    });

    recognition.onresult = (event) => {
        if(sourceInput) {
            sourceInput.value = event.results[0][0].transcript;
            sourceInput.dispatchEvent(new Event('input'));
        }
    };
    recognition.onerror = () => stopRecordingUI();
    recognition.onend = () => stopRecordingUI();
}

function stopRecordingUI() {
    if(voiceInputBtn) voiceInputBtn.classList.remove("recording");
    if(sourceInput) sourceInput.placeholder = "Enter text, use voice, or upload an image...";
}

function runVoiceEngine(text, langCode) {
    if (!text) return;
    window.speechSynthesis.cancel();
    const availableVoices = window.speechSynthesis.getVoices();
    const targetVoice = availableVoices.find(voice => 
        voice.lang === langCode || voice.lang.startsWith(langCode.split('-')[0])
    );
    if (targetVoice) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = targetVoice;
        utterance.lang = langCode;
        utterance.rate = appSettings.speechRate;
        window.speechSynthesis.speak(utterance);
    } else {
        const baseLang = langCode.split('-')[0];
        const backupAudioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${baseLang}&client=tw-ob&q=${encodeURIComponent(text)}`;
        const audioPlayer = new Audio(backupAudioUrl);
        audioPlayer.playbackRate = appSettings.speechRate;
        audioPlayer.play().catch(err => console.error("Audio engine stream failure:", err));
    }
}

if (typeof speechSynthesis !== 'undefined' && speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
}

const listenSrcBtn = document.querySelector("#listen-source-btn");
if(listenSrcBtn) {
    listenSrcBtn.addEventListener("click", () => runVoiceEngine(sourceInput.value, sourceLangSelect.value));
}

const listenTgtBtn = document.querySelector("#listen-target-btn");
if(listenTgtBtn) {
    listenTgtBtn.addEventListener("click", () => runVoiceEngine(targetOutput.value, targetLangSelect.value));
}

// ========================================================
// 5. CACHE CONTROL & COMPILATION BOOTSTRAP
// ========================================================
function pushHistoryStack(input, output) {
    const logItem = { id: Date.now(), prompt: input, result: output };
    translationHistory.unshift(logItem);
    localStorage.setItem("a1_history", JSON.stringify(translationHistory));
    renderSidebarHistory();
}

function renderSidebarHistory() {
    if(!sidebarHistoryContainer) return;
    if (translationHistory.length === 0) {
        sidebarHistoryContainer.innerHTML = `<span class="no-history">No recents yet</span>`;
        return;
    }
    sidebarHistoryContainer.innerHTML = translationHistory.slice(0, 5).map(item => `
        <li class="history-link-item" title="${item.prompt.replace(/"/g, '&quot;')}">
            ${item.prompt.replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char] || char))}
        </li>
    `).join('');

    document.querySelectorAll(".history-link-item").forEach((link, idx) => {
        link.addEventListener("click", () => {
            if(sourceInput) sourceInput.value = translationHistory[idx].prompt;
            if(targetOutput) targetOutput.value = translationHistory[idx].result;
            const studioViewNav = document.querySelector('[data-target="translator-view"]');
            if(studioViewNav) studioViewNav.click();
        });
    });
}

const speechRateSlider = document.querySelector("#speech-rate");
if(speechRateSlider) {
    speechRateSlider.value = appSettings.speechRate;
    speechRateSlider.addEventListener("input", (e) => {
        appSettings.speechRate = parseFloat(e.target.value);
        localStorage.setItem("a1_settings", JSON.stringify(appSettings));
    });
}

const clearHistoryBtn = document.querySelector("#clear-history-btn");
if(clearHistoryBtn) {
    clearHistoryBtn.addEventListener("click", () => {
        translationHistory = [];
        localStorage.removeItem("a1_history");
        renderSidebarHistory();
        const totalCountDisplay = document.querySelector("#stats-total-count");
        if(totalCountDisplay) totalCountDisplay.innerText = "0";
    });
}

if(sourceInput && charCountSpan) {
    sourceInput.addEventListener("input", () => {
        charCountSpan.innerText = `${sourceInput.value.length} / 2000`;
    });
}

if(swapLanguagesBtn) {
    swapLanguagesBtn.addEventListener("click", () => {
        if(sourceInput && targetOutput && sourceLangSelect && targetLangSelect) {
            const tVal = sourceInput.value; sourceInput.value = targetOutput.value; targetOutput.value = tVal;
            const lVal = sourceLangSelect.value; sourceLangSelect.value = targetLangSelect.value; targetLangSelect.value = lVal;
            sourceInput.dispatchEvent(new Event('input'));
        }
    });
}

const copyTextBtn = document.querySelector("#copy-text-btn");
if(copyTextBtn) {
    copyTextBtn.addEventListener("click", () => {
        if (!targetOutput || !targetOutput.value) return;
        navigator.clipboard.writeText(targetOutput.value).then(() => {
            copyTextBtn.innerText = "✅";
            setTimeout(() => copyTextBtn.innerText = "📋", 1200);
        });
    });
}

// Bootstrap Setup Actions
updateProfileUI();
initProfileFormFields();
syncEngineSelection(appSettings.engine);
renderSidebarHistory();