-- =============================================================
-- SECUENCIA PARA GENERAR NÚMEROS DE EMPLEADO
-- =============================================================

CREATE SEQUENCE IF NOT EXISTS personal_numero_seq
    START WITH 1
    INCREMENT BY 1;

CREATE OR REPLACE FUNCTION generar_numero_empleado()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.numero_empleado IS NULL OR NEW.numero_empleado = '' THEN
        NEW.numero_empleado := 'EMP-' || LPAD(
            nextval('personal_numero_seq')::TEXT, 3, '0'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generar_numero_empleado ON personal;

CREATE TRIGGER trg_generar_numero_empleado
BEFORE INSERT ON personal
FOR EACH ROW
EXECUTE FUNCTION generar_numero_empleado();