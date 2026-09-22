from __future__ import annotations

from dataclasses import dataclass
from typing import Any, TypeAlias

from pydantic import BaseModel

JsonScalar: TypeAlias = str | int | float | bool | None
JsonValue: TypeAlias = JsonScalar | dict[str, "JsonValue"] | list["JsonValue"]
JsonObject: TypeAlias = dict[str, JsonValue]


@dataclass(slots=True)
class Notification:
    method: str
    payload: JsonObject


@dataclass(slots=True)
class IncomingRequest:
    id: str | int
    method: str
    payload: JsonObject


class ServerInfo(BaseModel):
    name: str | None = None
    version: str | None = None


class InitializeResponse(BaseModel):
    serverInfo: ServerInfo | None = None


class SessionDescriptor(BaseModel):
    sessionId: str
    cwd: str | None = None
    createdAt: int
    title: str | None = None


class SessionListEntry(SessionDescriptor):
    live: bool
    persisted: bool


class SessionListResult(BaseModel):
    sessions: list[SessionListEntry]


class SessionHistoryResult(BaseModel):
    session: SessionDescriptor
    # `list[dict[str, Any]]`, not `list[JsonObject]`: JsonValue is an implicit
    # recursive alias, and pydantic 2.13 cannot build a schema for it
    # (RecursionError at import). The wire shape is the same JSON objects.
    events: list[dict[str, Any]]
    truncated: bool


class SessionResumeResult(BaseModel):
    sessionId: str
    resumed: bool


class SessionRenameResult(BaseModel):
    sessionId: str
    title: str
