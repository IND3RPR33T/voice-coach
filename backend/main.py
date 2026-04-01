"""
AI Voice Microlearning Coach — FastAPI Backend
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel
import os, json, tempfile, hashlib, io
from datetime import datetime, timedelta

# ReportLab for Certificate Generation
try:
    from reportlab.lib.pagesizes import landscape, letter
    from reportlab.pdfgen import canvas
    from reportlab.lib.colors import HexColor
    REPORTLAB_AVAILABLE = True
except:
    REPORTLAB_AVAILABLE = False

# ─────────────────────────────────────────────────────────────
# 🔥 GEMINI SETUP (AUTO DETECT WORKING MODEL)
# ─────────────────────────────────────────────────────────────
try:
    import google.generativeai as genai

    GEMINI_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyCRfpJxEPk95hY8yRZiA9Ih2B_1GIvW7k0")

    if GEMINI_KEY:
        genai.configure(api_key=GEMINI_KEY)

        print("\n🔍 Checking available Gemini models...\n")

        available_models = []
        for m in genai.list_models():
            if "generateContent" in m.supported_generation_methods:
                name = m.name.replace("models/", "")
                available_models.append(name)
                print(f"✅ {name}")

        if available_models:
            MODEL_NAME = available_models[0]
            gemini_model = genai.GenerativeModel(MODEL_NAME)
            print(f"\n🚀 Using model: {MODEL_NAME}\n")
        else:
            gemini_model = None
            print("❌ No usable Gemini model found")

    else:
        gemini_model = None
        print("[WARN] No GEMINI_API_KEY")

except Exception as e:
    print(f"[WARN] Gemini init failed: {e}")
    gemini_model = None


# ─────────────────────────────────────────────────────────────
# 🔧 SAFE DEFAULTS (NO CRASH)
# ─────────────────────────────────────────────────────────────
TTS_AVAILABLE = False
STT_AVAILABLE = False

try:
    from gtts import gTTS
    TTS_AVAILABLE = True
except:
    pass

try:
    import whisper
    whisper_model = whisper.load_model("base")
    STT_AVAILABLE = True
except:
    whisper_model = None


# ─────────────────────────────────────────────────────────────
# 🚀 APP SETUP
# ─────────────────────────────────────────────────────────────
app = FastAPI(title="AI Voice Microlearning Coach")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

sessions = {}


# ─────────────────────────────────────────────────────────────
# 📦 MODELS
# ─────────────────────────────────────────────────────────────
class LessonRequest(BaseModel):
    topic: str
    language: str = "English"
    session_id: str = "default"

class QuestionRequest(BaseModel):
    question: str
    context: str = ""
    session_id: str = "default"

class QuizRequest(BaseModel):
    topic: str
    num_questions: int = 3
    session_id: str = "default"

class ScoreRequest(BaseModel):
    correct: int
    total: int
    topic: str = "General"

# ─────────────────────────────────────────────────────────────
# 🧠 PROMPTS
# ─────────────────────────────────────────────────────────────
LESSON_PROMPT = """Explain this topic simply for workers:
Topic: {topic}
Language: {language}

Give:
- short explanation
- 2 examples
- 1 takeaway
Return JSON."""

QNA_PROMPT = """Answer simply:
Question: {question}
Context: {context}
Max 3 sentences."""

QUIZ_PROMPT = """Create {num_questions} quiz questions about {topic} in JSON."""


# ─────────────────────────────────────────────────────────────
# 🛠 UTILS
# ─────────────────────────────────────────────────────────────
def update_user_stats(session_id, xp_gain):
    if session_id not in sessions:
        sessions[session_id] = {
            "lessons_done": 0, 
            "topics": [], 
            "score": None,
            "xp": 0,
            "level": 1,
            "streak": 1,
            "last_active": datetime.now().isoformat()
        }
    
    session = sessions[session_id]
    
    # Update XP & Level
    session["xp"] += xp_gain
    session["level"] = (session["xp"] // 1000) + 1
    
    # Update Streak
    now = datetime.now()
    last_active = datetime.fromisoformat(session.get("last_active", now.isoformat()))
    
    diff = (now.date() - last_active.date()).days
    if diff == 1:
        session["streak"] += 1
    elif diff > 1:
        session["streak"] = 1
        
    session["last_active"] = now.isoformat()
    return session

# ─────────────────────────────────────────────────────────────
# 🧠 LLM CALL
# ─────────────────────────────────────────────────────────────
def call_llm(prompt: str, prompt_type="auto"):

    if gemini_model:
        try:
            response = gemini_model.generate_content(prompt)

            if hasattr(response, "text") and response.text:
                res_text = response.text
                if "```" in res_text:
                    parts = res_text.split("```")
                    for p in parts:
                        if p.strip().startswith("json") or (p.strip() and p.strip()[0] in '{['):
                            res_text = p.split("\n", 1)[-1] if p.strip().startswith("json") else p
                            res_text = res_text.rsplit("```", 1)[0].strip()
                            break
                    else:
                        res_text = res_text.strip()
                return res_text

            elif hasattr(response, "candidates") and response.candidates:
                return response.candidates[0].content.parts[0].text

            else:
                return "No response"

        except Exception as e:
            print(f"LLM error: {e}")

    # ---------- FALLBACK ----------
    if prompt_type == "qna":
        return "Follow safety rules and ask supervisor if unsure."

    elif prompt_type == "quiz":
        return json.dumps([{
            "question": "What is safety?",
            "options": ["A", "B", "C", "D"],
            "correct": "B",
            "explanation": "Follow rules"
        }])

    else:
        return json.dumps({
            "title": f"Quick Lesson on {prompt_type}",
            "summary": "Brief orientation summary.",
            "lesson": "This lesson explains key safety and operational procedures for your workplace tasks.",
            "examples": ["Always check your environment", "Use protection equipment"],
            "key_takeaway": "Safety and precision ensure success.",
            "emoji": "📘"
        })


# ─────────────────────────────────────────────────────────────
# 🌐 ROUTES
# ─────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "API running"}

@app.get("/health")
def health():
    return {
        "llm": "gemini" if gemini_model else "fallback",
        "tts": TTS_AVAILABLE,
        "stt": STT_AVAILABLE,
        "reportlab": REPORTLAB_AVAILABLE
    }

@app.get("/session/{session_id}")
def get_session(session_id: str):
    if session_id not in sessions:
        update_user_stats(session_id, 0)
    return sessions[session_id]

# 🎯 Lesson
@app.post("/generate-lesson")
def generate_lesson(req: LessonRequest):
    prompt = LESSON_PROMPT.format(topic=req.topic, language=req.language)
    raw = call_llm(prompt, "lesson")

    try:
        data = json.loads(raw)
    except:
        data = {"lesson": raw, "title": req.topic, "summary": "Generic Lesson", "emoji": "📖", "examples": [], "key_takeaway": "Follow safety rules"}

    # Update stats
    session = update_user_stats(req.session_id, 100) # 100 XP per lesson
    session["lessons_done"] += 1
    if req.topic not in session["topics"]:
        session["topics"].append(req.topic)

    return {"success": True, "data": data, "session": session}


# ❓ Q&A
@app.post("/ask")
def ask(req: QuestionRequest):
    prompt = QNA_PROMPT.format(question=req.question, context=req.context)
    answer = call_llm(prompt, "qna")
    return {"answer": answer}


# 🧪 Quiz
@app.post("/generate-quiz")
def quiz(req: QuizRequest):
    prompt = QUIZ_PROMPT.format(topic=req.topic, num_questions=req.num_questions)
    raw = call_llm(prompt, "quiz")

    try:
        questions = json.loads(raw)
        if not isinstance(questions, list):
            if isinstance(questions, dict) and "questions" in questions:
                questions = questions["questions"]
            else:
                questions = [questions]
    except:
        questions = [
            {
                "question": f"What is most important about {req.topic}?",
                "options": ["A) Speed", "B) Safety", "C) Cost", "D) Appearance"],
                "correct": "B",
                "explanation": "Safety always comes first in any workplace activity."
            }
        ]

    return {"success": True, "questions": questions}


# 💾 Save Score
@app.post("/session/{session_id}/score")
def save_score(session_id: str, req: ScoreRequest):
    pct = round((req.correct / req.total) * 100) if req.total > 0 else 0
    
    # XP proportional to score
    xp_gain = req.correct * 50
    session = update_user_stats(session_id, xp_gain)
    session["score"] = pct
    
    return {"status": "saved", "session": session, "xp_gain": xp_gain}


# 🎓 Certificate Generation
@app.get("/generate-certificate")
def generate_certificate(name: str = "Worker", topic: str = "Safety Pro"):
    if not REPORTLAB_AVAILABLE:
        raise HTTPException(500, "ReportLab not installed")
    
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=landscape(letter))
    width, height = landscape(letter)
    
    # Background
    c.setStrokeColor(HexColor("#6c63ff"))
    c.setLineWidth(10)
    c.rect(20, 20, width-40, height-40)
    
    c.setStrokeColor(HexColor("#00d4aa"))
    c.setLineWidth(2)
    c.rect(30, 30, width-60, height-60)
    
    # Content
    c.setFont("Helvetica-Bold", 40)
    c.drawCentredString(width/2, height - 120, "CERTIFICATE OF COMPLETION")
    
    c.setFont("Helvetica", 20)
    c.drawCentredString(width/2, height - 180, "This is to certify that")
    
    c.setFont("Helvetica-Bold", 35)
    c.setFillColor(HexColor("#6c63ff"))
    c.drawCentredString(width/2, height - 240, name.upper())
    
    c.setFillColor(HexColor("#000000"))
    c.setFont("Helvetica", 20)
    c.drawCentredString(width/2, height - 300, "has successfully completed the course on")
    
    c.setFont("Helvetica-Bold", 25)
    c.drawCentredString(width/2, height - 350, topic)
    
    c.setFont("Helvetica", 15)
    c.drawCentredString(width/2, 100, f"Issued on {datetime.now().strftime('%Y-%m-%d')}")
    c.drawCentredString(width/2, 70, "By VoiceCoach AI")
    
    c.showPage()
    c.save()
    
    buffer.seek(0)
    return StreamingResponse(buffer, media_type="application/pdf", headers={
        "Content-Disposition": f"attachment; filename=Certificate_{name}_{topic}.pdf"
    })


# 🔊 TTS
@app.get("/tts")
def tts(text: str):
    if not TTS_AVAILABLE:
        raise HTTPException(501, "Install gTTS")

    path = os.path.join(tempfile.gettempdir(), "audio.mp3")
    gTTS(text=text).save(path)
    return FileResponse(path)


# 🎤 STT
@app.post("/voice")
async def voice(audio: UploadFile = File(...)):
    if not STT_AVAILABLE:
        return {"text": "STT not available"}

    path = os.path.join(tempfile.gettempdir(), "audio.wav")
    with open(path, "wb") as f:
        f.write(await audio.read())

    result = whisper_model.transcribe(path)
    return {"text": result["text"]}