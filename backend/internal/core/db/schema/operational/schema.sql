CREATE TYPE appointment_status AS ENUM ('completada', 'cancelada', 'no_show', 'agendada');
CREATE TYPE specialty AS ENUM ('ginecologia', 'obstetricia', 'menopausia');
CREATE TYPE payment_method AS ENUM ('TC', 'TD', 'Efectivo');
CREATE TYPE payment_status AS ENUM ('completado', 'pendiente', 'reembolsado');

CREATE TABLE clinics (
    id   VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    active        BOOLEAN NOT NULL DEFAULT true,
    slots_per_day INTEGER NOT NULL
);

CREATE TABLE doctors (
    id        VARCHAR(10) PRIMARY KEY,
    name      VARCHAR(150) NOT NULL,
    specialty specialty   NOT NULL,
    clinic_id VARCHAR(10) NOT NULL REFERENCES clinics(id),
    active    BOOLEAN     NOT NULL DEFAULT true
);

CREATE TABLE patients (
    id         VARCHAR(10) PRIMARY KEY,
    birth_date DATE NOT NULL
);

CREATE TABLE services (
    id        VARCHAR(10) PRIMARY KEY,
    name      VARCHAR(150) NOT NULL,
    specialty specialty   NOT NULL,
    price     INTEGER     NOT NULL,
    active    BOOLEAN     NOT NULL DEFAULT true
);

CREATE TABLE appointments (
    id         VARCHAR(10) PRIMARY KEY,
    patient_id VARCHAR(10)        NOT NULL REFERENCES patients(id),
    doctor_id  VARCHAR(10)        NOT NULL REFERENCES doctors(id),
    clinic_id  VARCHAR(10)        NOT NULL REFERENCES clinics(id),
    service_id VARCHAR(10)        NOT NULL REFERENCES services(id),
    date       DATE               NOT NULL,
    hour       TIME               NOT NULL,
    status     appointment_status NOT NULL
);

CREATE TABLE payments (
    id             VARCHAR(10) PRIMARY KEY,
    appointment_id VARCHAR(10)    NOT NULL REFERENCES appointments(id),
    amount         INTEGER        NOT NULL,
    method         payment_method NOT NULL,
    status         payment_status NOT NULL,
    payment_date   DATE           NOT NULL
);
