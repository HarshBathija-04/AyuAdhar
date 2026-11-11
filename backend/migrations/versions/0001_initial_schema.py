"""initial schema (users, patients incl. weight_kg/height_cm, food_items, diet_plans, appointments, progress, food_logs)

Folds in the former hand-run migration_add_weight_height.sql.

Revision ID: 0001
Revises: 
Create Date: 2026-11-11 20:22:39.423251
"""
from alembic import op
import sqlalchemy as sa


revision = '0001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:

    op.create_table('food_items',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=100), nullable=False),
    sa.Column('category', sa.String(length=50), nullable=False),
    sa.Column('calories', sa.Float(), nullable=False),
    sa.Column('protein', sa.Float(), nullable=False),
    sa.Column('carbs', sa.Float(), nullable=False),
    sa.Column('fats', sa.Float(), nullable=False),
    sa.Column('fiber', sa.Float(), nullable=True),
    sa.Column('rasa', sa.String(length=100), nullable=False),
    sa.Column('guna', sa.String(length=100), nullable=False),
    sa.Column('virya', sa.String(length=20), nullable=False),
    sa.Column('vipaka', sa.String(length=20), nullable=False),
    sa.Column('vata_effect', sa.Integer(), nullable=True),
    sa.Column('pitta_effect', sa.Integer(), nullable=True),
    sa.Column('kapha_effect', sa.Integer(), nullable=True),
    sa.Column('suitable_for', sa.String(length=100), nullable=False),
    sa.Column('meal_type', sa.String(length=50), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('users',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=100), nullable=False),
    sa.Column('email', sa.String(length=120), nullable=False),
    sa.Column('password', sa.String(length=255), nullable=False),
    sa.Column('role', sa.String(length=20), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('email')
    )
    op.create_table('patients',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('patient_user_id', sa.Integer(), nullable=True),
    sa.Column('name', sa.String(length=100), nullable=False),
    sa.Column('age', sa.Integer(), nullable=False),
    sa.Column('gender', sa.String(length=10), nullable=False),
    sa.Column('weight_kg', sa.Float(), nullable=True),
    sa.Column('height_cm', sa.Float(), nullable=True),
    sa.Column('prakriti', sa.String(length=50), nullable=False),
    sa.Column('condition', sa.Text(), nullable=True),
    sa.Column('lifestyle', sa.Text(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['patient_user_id'], ['users.id'], ),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_patients_patient_user_id'), 'patients', ['patient_user_id'], unique=False)
    op.create_index(op.f('ix_patients_user_id'), 'patients', ['user_id'], unique=False)
    op.create_table('appointments',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('patient_id', sa.Integer(), nullable=False),
    sa.Column('appointment_date', sa.DateTime(), nullable=False),
    sa.Column('notes', sa.Text(), nullable=True),
    sa.Column('status', sa.String(length=20), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_appointments_patient_id'), 'appointments', ['patient_id'], unique=False)
    op.create_table('diet_plans',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('patient_id', sa.Integer(), nullable=False),
    sa.Column('plan_name', sa.String(length=100), nullable=True),
    sa.Column('plan_data', sa.Text(), nullable=False),
    sa.Column('total_calories', sa.Float(), nullable=True),
    sa.Column('total_protein', sa.Float(), nullable=True),
    sa.Column('total_carbs', sa.Float(), nullable=True),
    sa.Column('total_fats', sa.Float(), nullable=True),
    sa.Column('vata_score', sa.Integer(), nullable=True),
    sa.Column('pitta_score', sa.Integer(), nullable=True),
    sa.Column('kapha_score', sa.Integer(), nullable=True),
    sa.Column('is_active', sa.Boolean(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_diet_plans_patient_id'), 'diet_plans', ['patient_id'], unique=False)
    op.create_table('food_logs',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('patient_id', sa.Integer(), nullable=False),
    sa.Column('food_item_id', sa.Integer(), nullable=False),
    sa.Column('date', sa.Date(), nullable=False),
    sa.Column('meal_type', sa.String(length=20), nullable=False),
    sa.Column('quantity', sa.Float(), nullable=True),
    sa.ForeignKeyConstraint(['food_item_id'], ['food_items.id'], ),
    sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_food_logs_patient_id'), 'food_logs', ['patient_id'], unique=False)
    op.create_table('progress',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('patient_id', sa.Integer(), nullable=False),
    sa.Column('week_number', sa.Integer(), nullable=False),
    sa.Column('adherence_score', sa.Integer(), nullable=True),
    sa.Column('weight', sa.Float(), nullable=True),
    sa.Column('notes', sa.Text(), nullable=True),
    sa.Column('symptoms', sa.Text(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_progress_patient_id'), 'progress', ['patient_id'], unique=False)
    op.create_table('diet_plan_foods',
    sa.Column('diet_plan_id', sa.Integer(), nullable=False),
    sa.Column('food_item_id', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['diet_plan_id'], ['diet_plans.id'], ),
    sa.ForeignKeyConstraint(['food_item_id'], ['food_items.id'], ),
    sa.PrimaryKeyConstraint('diet_plan_id', 'food_item_id')
    )



def downgrade() -> None:

    op.drop_table('diet_plan_foods')
    op.drop_index(op.f('ix_progress_patient_id'), table_name='progress')
    op.drop_table('progress')
    op.drop_index(op.f('ix_food_logs_patient_id'), table_name='food_logs')
    op.drop_table('food_logs')
    op.drop_index(op.f('ix_diet_plans_patient_id'), table_name='diet_plans')
    op.drop_table('diet_plans')
    op.drop_index(op.f('ix_appointments_patient_id'), table_name='appointments')
    op.drop_table('appointments')
    op.drop_index(op.f('ix_patients_user_id'), table_name='patients')
    op.drop_index(op.f('ix_patients_patient_user_id'), table_name='patients')
    op.drop_table('patients')
    op.drop_table('users')
    op.drop_table('food_items')

