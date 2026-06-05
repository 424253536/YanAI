from __future__ import annotations

from fastapi import APIRouter, File, Header, HTTPException, UploadFile
from pydantic import BaseModel, Field

from api.support import require_admin, require_identity
from services.prompt_service import prompt_library_service


class PromptLibraryRequest(BaseModel):
    title: str = ""
    description: str = ""
    preview: str = ""
    reference_image_urls: list[str] = Field(default_factory=list)
    prompt: str = ""
    author: str = ""
    link: str = ""
    mode: str = "generate"
    image_size: str = ""
    image_count: str = ""
    icon: str = ""
    quick_access: bool = False
    sort_order: int | None = None
    category: str = ""
    sub_category: str = ""
    source_prompt_id: str = ""


class PromptImportRequest(BaseModel):
    target_scope: str = ""


class PromptRejectRequest(BaseModel):
    reason: str = ""


def _prompt_response(items: list[dict[str, object]] | None = None) -> dict[str, object]:
    if items is None:
        items = prompt_library_service.list_prompts()
    return {
        "items": items,
        "prompts": items,
        "prompt_count": len(items),
    }


def create_router() -> APIRouter:
    router = APIRouter()

    @router.get("/api/prompts")
    async def list_prompts(authorization: str | None = Header(default=None)):
        identity = require_identity(authorization)
        return _prompt_response(prompt_library_service.list_available_prompts(identity))

    @router.get("/api/me/prompts")
    async def user_list_prompts(authorization: str | None = Header(default=None)):
        identity = require_identity(authorization)
        return _prompt_response(prompt_library_service.list_user_prompts(identity))

    @router.post("/api/me/prompts")
    async def user_create_prompt(body: PromptLibraryRequest, authorization: str | None = Header(default=None)):
        identity = require_identity(authorization)
        try:
            item = prompt_library_service.create_user_prompt(body.model_dump(mode="python"), identity)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail={"error": str(exc)}) from exc
        return {"item": item, **_prompt_response(prompt_library_service.list_user_prompts(identity))}

    @router.post("/api/me/prompts/{prompt_id}")
    async def user_update_prompt(
            prompt_id: str,
            body: PromptLibraryRequest,
            authorization: str | None = Header(default=None),
    ):
        identity = require_identity(authorization)
        try:
            item = prompt_library_service.update_user_prompt(prompt_id, body.model_dump(exclude_unset=True, mode="python"), identity)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail={"error": str(exc)}) from exc
        if item is None:
            raise HTTPException(status_code=404, detail={"error": "prompt not found"})
        return {"item": item, **_prompt_response(prompt_library_service.list_user_prompts(identity))}

    @router.delete("/api/me/prompts/{prompt_id}")
    async def user_delete_prompt(prompt_id: str, authorization: str | None = Header(default=None)):
        identity = require_identity(authorization)
        if not prompt_library_service.delete_user_prompt(prompt_id, identity):
            raise HTTPException(status_code=404, detail={"error": "prompt not found"})
        return _prompt_response(prompt_library_service.list_user_prompts(identity))

    @router.post("/api/me/prompts/{prompt_id}/submit")
    async def user_submit_prompt(prompt_id: str, authorization: str | None = Header(default=None)):
        identity = require_identity(authorization)
        try:
            item = prompt_library_service.submit_user_prompt(prompt_id, identity)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail={"error": str(exc)}) from exc
        if item is None:
            raise HTTPException(status_code=404, detail={"error": "prompt not found"})
        return {"item": item, **_prompt_response(prompt_library_service.list_user_prompts(identity))}

    @router.post("/api/prompts/share")
    async def create_prompt_share(body: PromptLibraryRequest, authorization: str | None = Header(default=None)):
        identity = require_identity(authorization)
        try:
            item = prompt_library_service.create_share(
                body.model_dump(mode="python"),
                identity,
                source_prompt_id=body.source_prompt_id,
            )
        except ValueError as exc:
            raise HTTPException(status_code=400, detail={"error": str(exc)}) from exc
        return {"item": item, "share_id": item.get("share_id")}

    @router.post("/api/prompts/{prompt_id}/share")
    async def share_existing_prompt(prompt_id: str, authorization: str | None = Header(default=None)):
        identity = require_identity(authorization)
        try:
            item = prompt_library_service.share_prompt(prompt_id, identity)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail={"error": str(exc)}) from exc
        if item is None:
            raise HTTPException(status_code=404, detail={"error": "prompt not found"})
        return {"item": item, "share_id": item.get("share_id")}

    @router.get("/api/prompts/share/{share_id}")
    async def get_prompt_share(share_id: str, authorization: str | None = Header(default=None)):
        require_identity(authorization)
        item = prompt_library_service.get_shared_prompt(share_id)
        if item is None:
            raise HTTPException(status_code=404, detail={"error": "shared prompt not found"})
        return {"item": item, "share_id": item.get("share_id")}

    @router.post("/api/prompts/share/{share_id}/import")
    async def import_prompt_share(
            share_id: str,
            body: PromptImportRequest | None = None,
            authorization: str | None = Header(default=None),
    ):
        identity = require_identity(authorization)
        try:
            item = prompt_library_service.import_shared_prompt(
                share_id,
                identity,
                target_scope=(body.target_scope if body else ""),
            )
        except ValueError as exc:
            raise HTTPException(status_code=400, detail={"error": str(exc)}) from exc
        if item is None:
            raise HTTPException(status_code=404, detail={"error": "shared prompt not found"})
        return {"item": item}

    @router.get("/api/admin/prompts")
    async def admin_list_prompts(authorization: str | None = Header(default=None)):
        require_admin(authorization)
        return _prompt_response(prompt_library_service.list_admin_prompts())

    @router.post("/api/admin/prompts")
    async def admin_create_prompt(body: PromptLibraryRequest, authorization: str | None = Header(default=None)):
        require_admin(authorization)
        try:
            item = prompt_library_service.create_prompt(body.model_dump(mode="python"))
        except ValueError as exc:
            raise HTTPException(status_code=400, detail={"error": str(exc)}) from exc
        return {"item": item, **_prompt_response(prompt_library_service.list_admin_prompts())}

    @router.post("/api/me/prompt-assets")
    async def user_upload_prompt_asset(
            file: UploadFile = File(...),
            authorization: str | None = Header(default=None),
    ):
        require_identity(authorization)
        data = await file.read()
        try:
            url = prompt_library_service.save_asset(
                data,
                filename=file.filename or "image.png",
                content_type=file.content_type or "",
            )
        except ValueError as exc:
            raise HTTPException(status_code=400, detail={"error": str(exc)}) from exc
        except OSError as exc:
            raise HTTPException(status_code=500, detail={"error": f"failed to save image asset: {exc}"}) from exc
        return {"url": url}

    @router.post("/api/admin/prompt-assets")
    @router.post("/api/admin/prompts/assets")
    async def admin_upload_prompt_asset(
            file: UploadFile = File(...),
            authorization: str | None = Header(default=None),
    ):
        require_admin(authorization)
        data = await file.read()
        try:
            url = prompt_library_service.save_asset(
                data,
                filename=file.filename or "image.png",
                content_type=file.content_type or "",
            )
        except ValueError as exc:
            raise HTTPException(status_code=400, detail={"error": str(exc)}) from exc
        except OSError as exc:
            raise HTTPException(status_code=500, detail={"error": f"failed to save image asset: {exc}"}) from exc
        return {"url": url}

    @router.post("/api/admin/prompts/{prompt_id}")
    async def admin_update_prompt(
            prompt_id: str,
            body: PromptLibraryRequest,
            authorization: str | None = Header(default=None),
    ):
        require_admin(authorization)
        try:
            item = prompt_library_service.update_prompt(prompt_id, body.model_dump(exclude_unset=True, mode="python"))
        except ValueError as exc:
            raise HTTPException(status_code=400, detail={"error": str(exc)}) from exc
        if item is None:
            raise HTTPException(status_code=404, detail={"error": "prompt not found"})
        return {"item": item, **_prompt_response(prompt_library_service.list_admin_prompts())}

    @router.post("/api/admin/prompts/{prompt_id}/approve")
    async def admin_approve_prompt(prompt_id: str, authorization: str | None = Header(default=None)):
        identity = require_admin(authorization)
        try:
            item = prompt_library_service.approve_prompt(prompt_id, identity)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail={"error": str(exc)}) from exc
        if item is None:
            raise HTTPException(status_code=404, detail={"error": "prompt not found"})
        return {"item": item, **_prompt_response(prompt_library_service.list_admin_prompts())}

    @router.post("/api/admin/prompts/{prompt_id}/reject")
    async def admin_reject_prompt(
            prompt_id: str,
            body: PromptRejectRequest | None = None,
            authorization: str | None = Header(default=None),
    ):
        identity = require_admin(authorization)
        try:
            item = prompt_library_service.reject_prompt(prompt_id, identity, reason=body.reason if body else "")
        except ValueError as exc:
            raise HTTPException(status_code=400, detail={"error": str(exc)}) from exc
        if item is None:
            raise HTTPException(status_code=404, detail={"error": "prompt not found"})
        return {"item": item, **_prompt_response(prompt_library_service.list_admin_prompts())}

    @router.delete("/api/admin/prompts/{prompt_id}")
    async def admin_delete_prompt(prompt_id: str, authorization: str | None = Header(default=None)):
        require_admin(authorization)
        if not prompt_library_service.delete_prompt(prompt_id):
            raise HTTPException(status_code=404, detail={"error": "prompt not found"})
        return _prompt_response(prompt_library_service.list_admin_prompts())

    return router
