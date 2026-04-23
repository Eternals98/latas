from src.models import MedioPago
from src.services.medios_pago_service import INITIAL_MEDIOS_PAGO, ensure_initial_catalog, list_active_medios_pago


def test_list_active_medios_pago_filters_inactive_and_orders_deterministically(db_session):
    db_session.add(MedioPago(codigo="zeta", nombre="Zeta", activo=True))
    db_session.add(MedioPago(codigo="alpha", nombre="Alpha", activo=True))
    db_session.add(MedioPago(codigo="beta_inactivo", nombre="Beta", activo=False))
    db_session.commit()

    results = list_active_medios_pago(db_session)

    assert [item.nombre for item in results] == ["Alpha", "Zeta"]
    assert all(item.activo for item in results)


def test_ensure_initial_catalog_is_idempotent_and_codes_are_stable_unique(db_session):
    ensure_initial_catalog(db_session)
    ensure_initial_catalog(db_session)

    medios = db_session.query(MedioPago).order_by(MedioPago.codigo.asc()).all()

    expected_codes = sorted(codigo for codigo, _ in INITIAL_MEDIOS_PAGO)
    assert [medio.codigo for medio in medios] == expected_codes
    assert len({medio.codigo for medio in medios}) == len(expected_codes)


def test_seeded_items_include_traceability_defaults(db_session):
    ensure_initial_catalog(db_session)

    medios = db_session.query(MedioPago).all()

    assert len(medios) == 10
    assert all(medio.activo is True for medio in medios)
    assert all(medio.creado_en is not None for medio in medios)
    assert all(medio.modificado_en is not None for medio in medios)
