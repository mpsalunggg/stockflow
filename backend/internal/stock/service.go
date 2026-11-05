package stock

import "context"

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Adjust(ctx context.Context, productID int, in AdjustInput) (AdjustResult, error) {
	in.normalize()
	if err := in.validate(); err != nil {
		return AdjustResult{}, err
	}
	return s.repo.Adjust(ctx, productID, in)
}

func (s *Service) Movements(ctx context.Context, productID int) (MovementList, error) {
	movements, err := s.repo.ListMovements(ctx, productID)
	if err != nil {
		return MovementList{}, err
	}
	return MovementList{Data: movements}, nil
}
