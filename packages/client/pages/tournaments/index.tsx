import React, { useEffect, useState } from 'react'
import { TournamentCard } from '../../components/tournament/tournamentCard'
import styles from './index.module.scss'
import { ParticipantRoleType, useGetTournamentsQuery } from '@generated/graphql'
import { useAuth } from '@hooks/useAuth'
import { Loader } from '@components/ui/loader'
import { handleError } from '@handlers/errorHandler'
import { Box, Button, Paper, Tab, Tabs, Fab, FormControlLabel, Checkbox, FormGroup } from '@mui/material'
import { TournamentSearch } from '@components/tournament/tournamentSearch'
import { AddRounded } from '@mui/icons-material'
import { useWindowSize } from '@hooks/useWindowSize'
import Fuse from 'fuse.js'
import { Empty } from '@components/ui/empty'

const Index: React.FC = () => {
  const { user } = useAuth()
  const { breakpoint, isMobile } = useWindowSize()
  const [currentTab, setCurrentTab] = useState(1)
  const [tournamentSearch, setTournamentSearch] = useState<string>('')
  const [renderedTournaments, setRenderedTournaments] = useState<
    Array<JSX.Element | null>
  >([])
  const {
    data: tournamentsData,
    loading: tournamentsLoading,
  } = useGetTournamentsQuery({
    onError: (error) => handleError(error),
  })
  const {
    data: participatingData,
    loading: participatingLoading,
  } = useGetTournamentsQuery({
    variables: {
      userHasParticipantRoles: [
        ParticipantRoleType.Host,
        ParticipantRoleType.Admin,
        ParticipantRoleType.Player,
        ParticipantRoleType.Moderator,
      ],
    },
    skip: user === undefined,
    onError: (error) => handleError(error),
  })

  useEffect(() => {
    const renderTournaments = (
      participating?: boolean
    ): Array<JSX.Element | null> => {
      const tournaments = participating
        ? participatingData?.tournaments
        : tournamentsData?.tournaments

      if (!tournaments?.length) {
        if (participating) {
          return [
            <Paper key="not_participating" className={styles.empty}>
              <Empty title="You are not participating in any tournaments..." />
            </Paper>,
          ]
        }

        return [
          <Paper key="no_tournaments" className={styles.empty}>
            <Empty title="Unable to find tournaments..." />
          </Paper>,
        ]
      }

      const fuse = new Fuse(tournaments, {
        includeScore: true,
        threshold: 0.6,
        keys: ['title', 'hostUser.displayName', 'game.title'],
      })

      const searchedTournaments =
        tournamentSearch.length > 0
          ? fuse
              .search(tournamentSearch.toString())
              .map((result) => result.item)
          : tournaments

      if (!searchedTournaments?.length) {
        return [
          <Paper key="not_search_match" className={styles.empty}>
            <Empty
              title="No tournaments match you current search..."
              description="Create a tournament to liven up the place!"
            />
          </Paper>,
        ]
      }

      return searchedTournaments?.map((element) => {
        if (!element) return null
        return (
          <TournamentCard
            key={element.id}
            tournament={element}
            className={styles.tournamentCard}
            backgroundSrc="/assets/images/thisIsABanner.png"
            toHub={element.hostUser.id === user?.id}
            data-cy="tournamentCard"
          />
        )
      })
    }

    setRenderedTournaments(renderTournaments(currentTab === 2) ?? [])
  }, [
    currentTab,
    tournamentSearch,
    user?.id,
    participatingData?.tournaments,
    tournamentsData?.tournaments,
  ])

  return (
    <Box className={styles.discovery}>
      {!isMobile && breakpoint !== 'lg' && (
        <Box className={styles.searchAndFilter}>
          <Paper className={styles.search}>
            <TournamentSearch
              value={tournamentSearch}
              onChange={(e) => setTournamentSearch(e.target.value)}
            />
          </Paper>

          <Paper className={styles.filter}>
            <FormGroup>
              <h3>Games</h3>
              <FormControlLabel control={<Checkbox />} label="Fortnite" />
              <FormControlLabel control={<Checkbox />} label="League of Legends" />
              <FormControlLabel control={<Checkbox />} label="Rocket League" />
              <FormControlLabel control={<Checkbox />} label="Call of Duty" />

              <h3>Party Size</h3>
              <FormControlLabel control={<Checkbox />} label="Solos" />
              <FormControlLabel control={<Checkbox />} label="Duo" />
              <FormControlLabel control={<Checkbox />} label="Trios/Squads" />

              <h3>Status</h3>
              <FormControlLabel control={<Checkbox />} label="Open" />
              <FormControlLabel control={<Checkbox />} label="Coming Soon" />
            </FormGroup>
            <Button variant="contained" color="primary" onMouseOver={() => this.style.backgroundColor = 'red'} onMouseOut={() => this.style.backgroundColor = ''}>Search</Button>
          </Paper>
        </Box>
      )}
      <Box className={styles.tournamentLists}>
        {breakpoint === 'lg' && (
          <Paper className={styles.search}>
            <TournamentSearch
              value={tournamentSearch}
              onChange={(e) => setTournamentSearch(e.target.value)}
            />
          </Paper>
        )}
        <Box className={styles.navigation}>
          <Paper
            sx={{
              flex: '2',
              borderRadius: '0.75rem',
            }}
          >
            <Tabs
              centered
              value={currentTab}
              onChange={(_, value) => setCurrentTab(value)}
            >
              <Tab label="All Tournaments" value={1} />
              <Tab label="My Tournaments" value={2} data-cy="userTournaments" />
            </Tabs>
          </Paper>

          {!isMobile && (
            <Paper className={styles.create}>
              <Button href="/tournament/new" startIcon={<AddRounded />}>
                Create Tournament
              </Button>
            </Paper>
          )}
        </Box>

        <Box className={styles.tournamentList}>
          {tournamentsLoading || participatingLoading ? (
            <Loader />
          ) : (
            renderedTournaments
          )}
        </Box>
      </Box>
      {isMobile && (
        <Fab
          variant="extended"
          aria-label="Create"
          color="primary"
          className={styles.createFab}
          href="/tournament/new"
        >
          <AddRounded />
          Create
        </Fab>
      )}
    </Box>
  )
}

export default Index
