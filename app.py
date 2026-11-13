"""API de Didppi.

Un solo proyecto de Vercel: este archivo es el backend y la carpeta
``dist/`` (la compila Vite) es la interfaz. Las rutas /api llegan aquí.
"""

from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from motor.casos import PRESETS
from motor.inspeccion import inspeccionar

app = FastAPI(title="Didppi", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class PedidoIn(BaseModel):
    caso: str = ""
    hechos: dict = Field(default_factory=dict)


@app.get("/api/salud")
def salud():
    return {"ok": True, "app": "Didppi"}


@app.get("/api/casos")
def casos():
    return PRESETS


@app.post("/api/inspeccionar")
def post_inspeccionar(pedido: PedidoIn):
    try:
        return inspeccionar(pedido.hechos, pedido.caso)
    except (KeyError, TypeError, ValueError) as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


# En Vercel, app.frontend publica la interfaz en el mismo dominio.
# En local, Vite sirve la interfaz y proxea /api hacia este proceso.
_frontend = getattr(app, "frontend", None)
_public = Path(__file__).resolve().parent / "dist"
if _frontend is not None and _public.exists():
    _frontend("/", directory=str(_public), fallback="index.html")
